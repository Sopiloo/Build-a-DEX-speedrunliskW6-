"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface NFTCardProps {
  tokenId: number;
}

export const NFTCard = ({ tokenId }: NFTCardProps) => {
  const { address: connectedAddress } = useAccount();
  const [showListModal, setShowListModal] = useState(false);
  const [listPrice, setListPrice] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [ethPriceUSD, setEthPriceUSD] = useState<number>(0);

  // Get marketplace and price feed contracts (for address/ABI only if needed later)
  const { data: marketplaceContract } = useDeployedContractInfo("NFTMarketplace");
  const marketplaceAddress = marketplaceContract?.address as `0x${string}` | undefined;

  // On-chain reads
  const { data: owner } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "ownerOf",
    args: [BigInt(tokenId)],
  });

  const { data: listing, refetch: refetchListing } = useScaffoldContractRead({
    contractName: "NFTMarketplace",
    functionName: "getListing",
    args: [BigInt(tokenId)],
  });

  const { data: approvedAddress, refetch: refetchApproved } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "getApproved",
    args: [BigInt(tokenId)],
  });

  const { data: isApprovedForAll, refetch: refetchApprovedForAll } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "isApprovedForAll",
    args: [owner as `0x${string}`, marketplaceAddress as `0x${string}`],
    enabled: Boolean(owner && marketplaceAddress),
  });

  // Lightweight ETH/USD fetching (no extra deps)
  const fetchEthPrice = useCallback(async () => {
    try {
      const url = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const price = data?.ethereum?.usd;
      if (typeof price === "number" && !Number.isNaN(price)) {
        setEthPriceUSD(price);
      }
    } catch (e) {
      console.error("Failed to fetch ETH price", e);
    }
  }, []);

  useEffect(() => {
    fetchEthPrice();
    const id = setInterval(fetchEthPrice, 30000);
    return () => clearInterval(id);
  }, [fetchEthPrice]);

  useEffect(() => {
    if (marketplaceAddress) {
      setIsApproved(
        (approvedAddress as string | undefined)?.toLowerCase() === (marketplaceAddress as string | undefined)?.toLowerCase() ||
          isApprovedForAll === true,
      );
    }
  }, [approvedAddress, isApprovedForAll, marketplaceAddress]);

  // Writes
  const { writeAsync: approveMarketplace } = useScaffoldContractWrite({
    contractName: "MyNFT",
    functionName: "setApprovalForAll",
    args: [marketplaceAddress as `0x${string}`, true],
    onBlockConfirmation: async (txnReceipt: any) => {
      await refetchApproved();
      await refetchApprovedForAll();
      setIsApproving(false);
      notification.success("Marketplace approved! You can now list your NFT.");
    },
  });

  const { writeAsync: listItem } = useScaffoldContractWrite({
    contractName: "NFTMarketplace",
    functionName: "listItem",
    args: [BigInt(tokenId), parseEther(listPrice || "0")],
  });

  const { writeAsync: buyItem } = useScaffoldContractWrite({
    contractName: "NFTMarketplace",
    functionName: "buyItem",
    args: [BigInt(tokenId)],
    value: (listing as any)?.isActive ? (listing as any)?.price : undefined,
  });

  const { writeAsync: cancelListing } = useScaffoldContractWrite({
    contractName: "NFTMarketplace",
    functionName: "cancelListing",
    args: [BigInt(tokenId)],
  });

  // Handlers
  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await approveMarketplace();
      notification.success("Approval transaction sent! Waiting for confirmation...");
    } catch (error) {
      console.error("Approval failed:", error);
      notification.error("Approval failed");
      setIsApproving(false);
    }
  };

  const handleList = async () => {
    if (!listPrice || parseFloat(listPrice) <= 0) {
      notification.error("Please enter a valid price");
      return;
    }
    try {
      await listItem();
      notification.success("NFT listed successfully!");
      setShowListModal(false);
      setListPrice("");
      setTimeout(() => refetchListing(), 2000);
    } catch (error) {
      console.error("Listing failed:", error);
      notification.error("Listing failed");
    }
  };

  const handleBuy = async () => {
    try {
      await buyItem();
      notification.success("NFT purchased successfully!");
      setTimeout(() => refetchListing(), 2000);
    } catch (error) {
      console.error("Purchase failed:", error);
      notification.error("Purchase failed");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelListing();
      notification.success("Listing canceled!");
      setTimeout(() => refetchListing(), 2000);
    } catch (error) {
      console.error("Cancel failed:", error);
      notification.error("Cancel failed");
    }
  };

  const isOwner = (owner as string | undefined)?.toLowerCase() === connectedAddress?.toLowerCase();
  const isListed = (listing as any)?.isActive === true;
  const priceInEth = (listing as any)?.price ? formatEther((listing as any).price) : "0";
  const priceInUSD = ethPriceUSD > 0 ? (parseFloat(priceInEth) * ethPriceUSD).toFixed(2) : "0.00";

  return (
    <>
      <div className="card bg-base-100 shadow-xl">
        <figure className="px-10 pt-10">
          <div className="w-full h-48 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <span className="text-6xl font-bold text-white">#{tokenId}</span>
          </div>
        </figure>
        <div className="card-body">
          <h2 className="card-title">
            NFT #{tokenId}
            {isListed && <div className="badge badge-success">Listed</div>}
          </h2>

          <div className="text-sm">
            <p className="text-gray-600">Owner:</p>
            <Address address={owner as `0x${string}`} size="sm" />
          </div>

          {isListed && (
            <div className="stats shadow mt-2">
              <div className="stat p-4">
                <div className="stat-title text-xs">Price</div>
                <div className="stat-value text-lg">{parseFloat(priceInEth).toFixed(4)} ETH</div>
                {ethPriceUSD > 0 && <div className="stat-desc">~${priceInUSD} USD</div>}
              </div>
            </div>
          )}

          <div className="card-actions justify-end mt-4">
            {!isOwner && isListed && (
              <button className="btn btn-primary btn-sm" onClick={handleBuy}>
                Buy Now
              </button>
            )}

            {isOwner && !isListed && !isApproved && !isApproving && (
              <button className="btn btn-secondary btn-sm" onClick={handleApprove}>
                Approve Marketplace
              </button>
            )}

            {isOwner && !isListed && isApproving && (
              <button className="btn btn-secondary btn-sm loading" disabled>
                Approving...
              </button>
            )}

            {isOwner && !isListed && isApproved && !isApproving && (
              <button className="btn btn-accent btn-sm" onClick={() => setShowListModal(true)}>
                List for Sale
              </button>
            )}

            {isOwner && isListed && (
              <button className="btn btn-error btn-sm" onClick={handleCancel}>
                Cancel Listing
              </button>
            )}
          </div>
        </div>
      </div>

      {showListModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">List NFT #{tokenId}</h3>
            <div className="form-control w-full mt-4">
              <label className="label">
                <span className="label-text">Price in ETH</span>
              </label>
              <input
                type="number"
                step="0.001"
                placeholder="0.5"
                className="input input-bordered w-full"
                value={listPrice}
                onChange={e => setListPrice(e.target.value)}
              />
              {listPrice && ethPriceUSD > 0 && (
                <label className="label">
                  <span className="label-text-alt">~${(parseFloat(listPrice) * ethPriceUSD).toFixed(2)} USD</span>
                </label>
              )}
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowListModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleList}>
                List NFT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
