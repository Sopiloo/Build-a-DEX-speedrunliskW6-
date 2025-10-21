// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ConcentratedDEX (v3-lite)
 * @notice Educational, simplified concentrated liquidity AMM with ranged positions.
 * NOT production-ready. Math is simplified and tick stepping is limited.
 */
contract ConcentratedDEX is ReentrancyGuard {
    // Tokens
    address public immutable token0;
    address public immutable token1;

    // Fee in basis points (e.g., 30 = 0.30%)
    uint24 public immutable feeBps;

    // Current price as sqrtPriceX96 and current tick (coarse)
    uint160 public sqrtPriceX96;
    int24 public tickCurrent;

    // Active in-range liquidity at current tick
    uint128 public liquidity; // simplified single active liquidity bucket at current tick

    // Tick spacing (coarse grid). Example: 100 = ~1% if ticks are pseudo-%.
    int24 public immutable tickSpacing;

    struct TickInfo {
        int128 liquidityNet; // net liquidity change when crossing this tick
        bool initialized;
    }

    // tick index => info
    mapping(int24 => TickInfo) public ticks;

    struct Position {
        uint128 liquidity; // position liquidity
        int24 lowerTick;
        int24 upperTick;
        address owner;
    }

    // key = keccak256(abi.encode(owner, lowerTick, upperTick))
    mapping(bytes32 => Position) public positions;

    event Initialize(uint160 sqrtPriceX96, int24 tick);
    event Mint(address indexed owner, int24 indexed lowerTick, int24 indexed upperTick, uint128 liquidity, uint256 amount0, uint256 amount1);
    event Burn(address indexed owner, int24 indexed lowerTick, int24 indexed upperTick, uint128 liquidity, uint256 amount0, uint256 amount1);
    event Swap(address indexed sender, bool zeroForOne, uint256 amountIn, uint256 amountOut, uint160 sqrtPriceX96, int24 tickCurrent);

    error InvalidTickRange();
    error NotInitialized();
    error ZeroLiquidity();

    constructor(address _token0, address _token1, uint24 _feeBps, int24 _tickSpacing) {
        require(_token0 != address(0) && _token1 != address(0) && _token0 != _token1, "bad tokens");
        require(_feeBps <= 10_000, "fee too high");
        token0 = _token0;
        token1 = _token1;
        feeBps = _feeBps;
        tickSpacing = _tickSpacing;
    }

    // --- Utils (extremely simplified for demo) ---
    function _tickToSqrtPriceX96(int24 tick) internal pure returns (uint160) {
        // For demo: sqrtPriceX96 = 2^(tick/64) scaled. This is NOT accurate; replace with real tick math in production.
        // We map tick to a simple linear scale for demonstration.
        int256 base = 1e12 + int256(tick) * 1e9; // fake scale
        if (base <= 0) base = 1; 
        return uint160(uint256(int256(base)));
    }

    function initialize(uint160 _sqrtPriceX96, int24 _tick) external {
        require(sqrtPriceX96 == 0, "already init");
        sqrtPriceX96 = _sqrtPriceX96;
        tickCurrent = _tick;
        emit Initialize(_sqrtPriceX96, _tick);
    }

    function _positionKey(address owner, int24 lowerTick, int24 upperTick) internal pure returns (bytes32) {
        return keccak256(abi.encode(owner, lowerTick, upperTick));
    }

    function _updateTicks(int24 lowerTick, int24 upperTick, int128 liqDelta) internal {
        TickInfo storage lower = ticks[lowerTick];
        TickInfo storage upper = ticks[upperTick];
        lower.liquidityNet += liqDelta;
        lower.initialized = true;
        upper.liquidityNet -= liqDelta;
        upper.initialized = true;
    }

    // Compute required amounts (very simplified approximation using current price only)
    function _amountsForLiquidity(uint128 liq) internal view returns (uint256 amount0, uint256 amount1) {
        if (sqrtPriceX96 == 0) revert NotInitialized();
        // Pretend token amounts are proportional to liquidity at current price
        amount0 = (uint256(liq) * 1e12) / 1e6; // arbitrary scale
        amount1 = (uint256(liq) * 1e12) / 1e6; // symmetric for demo
    }

    function mint(address owner, int24 lowerTick, int24 upperTick, uint128 liq, address payer)
        external
        nonReentrant
        returns (uint256 amount0, uint256 amount1)
    {
        if (upperTick <= lowerTick || ((lowerTick % tickSpacing) != 0) || ((upperTick % tickSpacing) != 0)) revert InvalidTickRange();
        if (liq == 0) revert ZeroLiquidity();
        if (sqrtPriceX96 == 0) revert NotInitialized();

        bytes32 key = _positionKey(owner, lowerTick, upperTick);
        Position storage p = positions[key];
        if (p.owner == address(0)) {
            p.owner = owner;
            p.lowerTick = lowerTick;
            p.upperTick = upperTick;
        }

        // Update global tick structures
        _updateTicks(lowerTick, upperTick, int128(int256(uint256(liq))));

        // If current tick within range, add to active liquidity (demo behavior)
        if (tickCurrent >= lowerTick && tickCurrent < upperTick) {
            liquidity += liq;
        }

        // Pull tokens from payer according to simplified formula
        (amount0, amount1) = _amountsForLiquidity(liq);
        require(IERC20(token0).transferFrom(payer, address(this), amount0), "pull0");
        require(IERC20(token1).transferFrom(payer, address(this), amount1), "pull1");

        // Update position
        p.liquidity += liq;

        emit Mint(owner, lowerTick, upperTick, liq, amount0, amount1);
    }

    function burn(address owner, int24 lowerTick, int24 upperTick, uint128 liq, address to)
        external
        nonReentrant
        returns (uint256 amount0, uint256 amount1)
    {
        bytes32 key = _positionKey(owner, lowerTick, upperTick);
        Position storage p = positions[key];
        require(p.owner == owner && p.liquidity >= liq, "pos");

        // Update ticks
        _updateTicks(lowerTick, upperTick, -int128(int256(uint256(liq))));

        if (tickCurrent >= lowerTick && tickCurrent < upperTick) {
            // reduce active liquidity
            if (liq > liquidity) liq = liquidity;
            liquidity -= liq;
        }

        // Return tokens by same simplified formula
        (amount0, amount1) = _amountsForLiquidity(liq);
        require(IERC20(token0).transfer(to, amount0), "send0");
        require(IERC20(token1).transfer(to, amount1), "send1");

        p.liquidity -= liq;

        emit Burn(owner, lowerTick, upperTick, liq, amount0, amount1);
    }

    function swap(bool zeroForOne, uint256 amountSpecified, address to)
        external
        nonReentrant
        returns (uint256 amountOut)
    {
        if (sqrtPriceX96 == 0) revert NotInitialized();
        require(amountSpecified > 0, "amt");

        // Fee
        uint256 fee = (amountSpecified * feeBps) / 10_000;
        uint256 amountAfterFee = amountSpecified - fee;

        if (zeroForOne) {
            // swap token0 -> token1
            require(IERC20(token0).transferFrom(msg.sender, address(this), amountSpecified), "pull0");
            // Demo price impact: move one tick per swap
            tickCurrent -= tickSpacing;
            sqrtPriceX96 = _tickToSqrtPriceX96(tickCurrent);
            amountOut = amountAfterFee; // symmetrical demo
            require(IERC20(token1).transfer(to, amountOut), "send1");
        } else {
            // swap token1 -> token0
            require(IERC20(token1).transferFrom(msg.sender, address(this), amountSpecified), "pull1");
            tickCurrent += tickSpacing;
            sqrtPriceX96 = _tickToSqrtPriceX96(tickCurrent);
            amountOut = amountAfterFee;
            require(IERC20(token0).transfer(to, amountOut), "send0");
        }

        emit Swap(msg.sender, zeroForOne, amountSpecified, amountOut, sqrtPriceX96, tickCurrent);
    }
}
