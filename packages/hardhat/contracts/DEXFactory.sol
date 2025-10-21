// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./SimpleDEX.sol";

/**
 * @title DEXFactory
 * @notice Factory to deploy SimpleDEX pairs for any two ERC20 tokens
 */
contract DEXFactory {
    // tokenA => tokenB => pair address
    mapping(address => mapping(address => address)) public getPair;

    event PairCreated(address indexed tokenA, address indexed tokenB, address pair);

    /**
     * @notice Create a new SimpleDEX pair for tokenA/tokenB if it doesn't exist
     * @param tokenA Address of first token
     * @param tokenB Address of second token
     * @return pair The address of the deployed SimpleDEX pair
     */
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != address(0) && tokenB != address(0), "Invalid token");
        require(tokenA != tokenB, "Identical tokens");

        // Order tokens to avoid duplicates (tokenA < tokenB)
        (address t0, address t1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(getPair[t0][t1] == address(0), "Pair exists");

        // Deploy new SimpleDEX
        pair = address(new SimpleDEX(t0, t1));

        // Save mapping both directions
        getPair[t0][t1] = pair;
        getPair[t1][t0] = pair;

        emit PairCreated(t0, t1, pair);
    }
}
