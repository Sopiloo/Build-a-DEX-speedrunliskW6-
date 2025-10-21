// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@redstone-finance/evm-connector/contracts/data-services/MainDemoConsumerBase.sol";

/**
 * @title PriceFeed
 * @notice Fetches real-time price data using RedStone Pull oracle
 * @dev Uses MainDemoConsumerBase for testnet compatibility
 */
contract PriceFeed is MainDemoConsumerBase {
    /**
     * @notice Override timestamp validation to allow more lenient checks
     * @dev Allows oracle data from up to 15 minutes in the past or future
     * This is useful for local development where blockchain time may differ from real-time
     * @param receivedTimestampMilliseconds Timestamp from the oracle data package
     */
    function validateTimestamp(uint256 receivedTimestampMilliseconds) public view virtual override {
        // Convert block.timestamp from seconds to milliseconds
        uint256 blockTimestampMilliseconds = block.timestamp * 1000;

        // Allow data from 15 minutes in the past or future
        uint256 maxTimestampDiffMilliseconds = 15 * 60 * 1000; // 15 minutes

        // Check if timestamp is too far in the past
        if (blockTimestampMilliseconds > receivedTimestampMilliseconds) {
            require(
                blockTimestampMilliseconds - receivedTimestampMilliseconds <= maxTimestampDiffMilliseconds,
                "Timestamp too old"
            );
        } else {
            // Check if timestamp is too far in the future
            require(
                receivedTimestampMilliseconds - blockTimestampMilliseconds <= maxTimestampDiffMilliseconds,
                "Timestamp too far in future"
            );
        }
    }

    /**
     * @notice Get the latest ETH/USD price
     * @return price The current ETH price in USD (8 decimals)
     */
    function getEthPrice() public view returns (uint256) {
        bytes32[] memory dataFeedIds = new bytes32[](1);
        dataFeedIds[0] = bytes32("ETH");

        uint256[] memory prices = getOracleNumericValuesFromTxMsg(dataFeedIds);
        return prices[0];
    }

    /**
     * @notice Get the latest BTC/USD price
     * @return price The current BTC price in USD (8 decimals)
     */
    function getBtcPrice() public view returns (uint256) {
        bytes32[] memory dataFeedIds = new bytes32[](1);
        dataFeedIds[0] = bytes32("BTC");

        uint256[] memory prices = getOracleNumericValuesFromTxMsg(dataFeedIds);
        return prices[0];
    }

    /**
     * @notice Get multiple prices at once
     * @return ethPrice The current ETH price
     * @return btcPrice The current BTC price
     */
    function getMultiplePrices() public view returns (uint256 ethPrice, uint256 btcPrice) {
        bytes32[] memory dataFeedIds = new bytes32[](2);
        dataFeedIds[0] = bytes32("ETH");
        dataFeedIds[1] = bytes32("BTC");

        uint256[] memory prices = getOracleNumericValuesFromTxMsg(dataFeedIds);
        return (prices[0], prices[1]);
    }
}
