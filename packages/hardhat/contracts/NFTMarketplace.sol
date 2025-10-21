// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NFTMarketplace
 * @notice Simple escrowless NFT marketplace for ERC721
 * @dev Sellers keep NFTs until sold, marketplace only needs approval
 */
contract NFTMarketplace is ReentrancyGuard {
    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }

    IERC721 public immutable nftContract;
    mapping(uint256 => Listing) public listings;

    event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event ItemSold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);
    event ItemCanceled(uint256 indexed tokenId, address indexed seller);

    constructor(address _nftContract) {
        require(_nftContract != address(0), "nft=0");
        nftContract = IERC721(_nftContract);
    }

    function listItem(uint256 tokenId, uint256 price) external {
        require(price > 0, "price=0");
        require(nftContract.ownerOf(tokenId) == msg.sender, "not owner");
        require(
            nftContract.getApproved(tokenId) == address(this) ||
                nftContract.isApprovedForAll(msg.sender, address(this)),
            "not approved"
        );
        require(!listings[tokenId].isActive, "listed");

        listings[tokenId] = Listing({seller: msg.sender, price: price, isActive: true});
        emit ItemListed(tokenId, msg.sender, price);
    }

    function buyItem(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        require(listing.isActive, "not listed");
        require(msg.value >= listing.price, "insufficient");
        require(nftContract.ownerOf(tokenId) == listing.seller, "owner changed");

        // mark sold first
        listings[tokenId].isActive = false;

        // transfer NFT
        nftContract.safeTransferFrom(listing.seller, msg.sender, tokenId);

        // pay seller
        (bool ok, ) = payable(listing.seller).call{value: listing.price}("");
        require(ok, "pay fail");

        // refund excess
        if (msg.value > listing.price) {
            (bool rOk, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(rOk, "refund fail");
        }

        emit ItemSold(tokenId, msg.sender, listing.seller, listing.price);
    }

    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.isActive, "not listed");
        require(listing.seller == msg.sender, "not seller");
        listings[tokenId].isActive = false;
        emit ItemCanceled(tokenId, msg.sender);
    }

    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }

    function isListed(uint256 tokenId) external view returns (bool) {
        return listings[tokenId].isActive;
    }
}
