// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ISimpleDEX {
    function tokenA() external view returns (address);
    function tokenB() external view returns (address);
    function getSwapAmount(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut);
    function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut) external returns (uint256 amountOut);
}

interface IERC20Minimal {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
}

interface IDEXFactory {
    function getPair(address tokenA, address tokenB) external view returns (address);
}

/**
 * @title DEXRouter
 * @notice Simple router to execute multi-hop swaps across SimpleDEX pairs created by DEXFactory
 */
contract DEXRouter {
    IDEXFactory public immutable factory;

    constructor(address _factory) {
        require(_factory != address(0), "factory=0");
        factory = IDEXFactory(_factory);
    }

    function getAmountsOut(uint256 amountIn, address[] calldata path) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "path too short");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i = 0; i < path.length - 1; i++) {
            address pair = factory.getPair(path[i], path[i + 1]);
            require(pair != address(0), "pair missing");
            amounts[i + 1] = ISimpleDEX(pair).getSwapAmount(path[i], amounts[i]);
        }
    }

    /**
     * @notice Swap exact tokens across a path of pairs. Caller must approve the router for amountIn of path[0].
     * @param amountIn Input amount of path[0]
     * @param minAmountOut Minimum acceptable output for the final token
     * @param path Array of token addresses (e.g., [TokenA, TokenB, TokenC])
     * @param to Recipient of final output tokens
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 minAmountOut,
        address[] calldata path,
        address to
    ) external returns (uint256[] memory amounts) {
        require(path.length >= 2, "path too short");
        require(to != address(0), "to=0");

        // Pull input tokens from user
        require(IERC20Minimal(path[0]).transferFrom(msg.sender, address(this), amountIn), "pull fail");

        // Precompute expected amounts for slippage protection
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= minAmountOut, "slippage");

        uint256 currentAmount = amountIn;
        for (uint256 i = 0; i < path.length - 1; i++) {
            address tokenIn = path[i];
            address tokenOut = path[i + 1];
            address pair = factory.getPair(tokenIn, tokenOut);
            require(pair != address(0), "pair missing");

            // Approve pair to pull tokens from router for this hop
            require(IERC20Minimal(tokenIn).approve(pair, currentAmount), "approve fail");

            // For intermediate hops, minOut = 0, for final hop enforce minAmountOut
            uint256 hopMinOut = (i == path.length - 2) ? minAmountOut : 0;
            uint256 received = ISimpleDEX(pair).swap(tokenIn, currentAmount, hopMinOut);
            currentAmount = received; // router receives outputs from pair
        }

        // Transfer final tokens to recipient
        require(IERC20Minimal(path[path.length - 1]).transfer(to, currentAmount), "send fail");
    }
}
