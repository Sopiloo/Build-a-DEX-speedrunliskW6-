// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IFlashSwapReceiver {
    function onFlashSwap(bytes calldata data) external;
}

/**
 * @title SimpleDEX
 * @notice A simplified decentralized exchange using constant product AMM (x * y = k)
 * @dev Now mints/burns ERC20 LP tokens representing liquidity shares
 */
contract SimpleDEX is ERC20, ReentrancyGuard {
    // Token addresses
    IERC20 public immutable tokenA;
    IERC20 public immutable tokenB;

    // Pool reserves
    uint256 public reserveA;
    uint256 public reserveB;

    // Optional legacy mapping for compatibility (mirrors LP balances)
    mapping(address => uint256) public liquidity;

    // --- Fee distribution accounting (claimable by LPs) ---
    uint256 public feePerLPTokenA; // scaled by 1e18
    uint256 public feePerLPTokenB; // scaled by 1e18
    mapping(address => uint256) public feeDebtA; // user debt = balance * feePerLPTokenA / 1e18
    mapping(address => uint256) public feeDebtB; // user debt = balance * feePerLPTokenB / 1e18

    // Fee (mutable via governance). Defaults to 0.3% = 3/1000
    uint256 public feeNumerator;
    uint256 public feeDenominator;

    // Governance address (expected to be a TimelockController). Only this can change parameters.
    address public governance;

    // --- TWAP ---
    struct Observation {
        uint32 timestamp;
        uint256 priceACumulative; // price of A in terms of B, 1e18-scaled, integrated over time
        uint256 priceBCumulative; // price of B in terms of A, 1e18-scaled, integrated over time
    }

    modifier onlyGovernance() {
        require(msg.sender == governance, "not governance");
        _;
    }

    function setGovernance(address _gov) external {
        // Allow one-time initialization by anyone ONLY if governance not set yet; otherwise only current governance
        if (governance != address(0)) {
            require(msg.sender == governance, "not governance");
        }
        require(_gov != address(0), "gov=0");
        governance = _gov;
    }

    function setFee(uint256 num, uint256 den) external onlyGovernance {
        require(den > 0, "den=0");
        // Safety cap: fee <= 1%
        require(num * 100 <= den, "fee too high");
        feeNumerator = num;
        feeDenominator = den;
    }
    Observation[] public observations;

    // Events
    event LiquidityAdded(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidityMinted
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 amountA,
        uint256 amountB,
        uint256 liquidityBurned
    );
    event Swap(
        address indexed user,
        address indexed tokenIn,
        uint256 amountIn,
        uint256 amountOut
    );
    event FlashSwap(address indexed user, address indexed token, uint256 amountOut, uint256 feePaid);

    event FeesAccrued(address indexed token, uint256 feeAmount, uint256 feePerLPToken);
    event FeesClaimed(address indexed user, uint256 amountA, uint256 amountB);

    /**
     * @notice Constructor sets the token pair
     * @param _tokenA Address of first token
     * @param _tokenB Address of second token
     */
    constructor(address _tokenA, address _tokenB) ERC20("SimpleDEX LP", "SLP-LP") {
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token address");
        require(_tokenA != _tokenB, "Tokens must be different");

        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);

        // default fee 0.3%
        feeNumerator = 3;
        feeDenominator = 1000;

        // Initialize observations with zero cumulatives
        observations.push(Observation({
            timestamp: uint32(block.timestamp),
            priceACumulative: 0,
            priceBCumulative: 0
        }));
    }

    /**
     * @dev Update cumulative price observations using current reserves.
     * Accumulates time-weighted price since last observation.
     */
    function _updateCumulative() internal {
        Observation storage lastObs = observations[observations.length - 1];
        uint32 nowTs = uint32(block.timestamp);
        if (nowTs == lastObs.timestamp) return;

        uint256 priceA_1e18 = 0;
        uint256 priceB_1e18 = 0;
        if (reserveA > 0 && reserveB > 0) {
            // priceA = B/A, priceB = A/B, both scaled by 1e18
            priceA_1e18 = (reserveB * 1e18) / reserveA;
            priceB_1e18 = (reserveA * 1e18) / reserveB;
        }

        uint256 timeElapsed = uint256(nowTs - lastObs.timestamp);
        observations.push(Observation({
            timestamp: nowTs,
            priceACumulative: lastObs.priceACumulative + priceA_1e18 * timeElapsed,
            priceBCumulative: lastObs.priceBCumulative + priceB_1e18 * timeElapsed
        }));
    }

    /**
     * @notice Add liquidity to the pool and mint LP tokens
     */
    function addLiquidity(uint256 amountA, uint256 amountB)
        external
        nonReentrant
        returns (uint256 liquidityMinted)
    {
        // Accumulate TWAP with current reserves before changing state
        _updateCumulative();
        require(amountA > 0 && amountB > 0, "Amounts must be greater than 0");

        // Transfer tokens from user to contract
        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);

        uint256 _totalSupply = totalSupply();

        // Calculate liquidity to mint (simple proportional model)
        if (_totalSupply == 0) {
            // First LP minter: simple seed (keep previous behavior)
            liquidityMinted = amountA;
        } else {
            uint256 liquidityA = (amountA * _totalSupply) / reserveA;
            uint256 liquidityB = (amountB * _totalSupply) / reserveB;
            liquidityMinted = liquidityA < liquidityB ? liquidityA : liquidityB;
        }

        require(liquidityMinted > 0, "Insufficient liquidity minted");

        // Mint LP
        _mint(msg.sender, liquidityMinted);
        liquidity[msg.sender] = balanceOf(msg.sender); // mirror for compatibility

        // Update reserves
        reserveA += amountA;
        reserveB += amountB;

        emit LiquidityAdded(msg.sender, amountA, amountB, liquidityMinted);
    }

    /**
     * @notice Remove liquidity by burning LP tokens
     */
    function removeLiquidity(uint256 liquidityAmount)
        external
        nonReentrant
        returns (uint256 amountA, uint256 amountB)
    {
        // Accumulate TWAP with current reserves before changing state
        _updateCumulative();
        require(liquidityAmount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= liquidityAmount, "Insufficient liquidity");

        uint256 _totalSupply = totalSupply();
        amountA = (liquidityAmount * reserveA) / _totalSupply;
        amountB = (liquidityAmount * reserveB) / _totalSupply;

        require(amountA > 0 && amountB > 0, "Insufficient liquidity burned");

        // Burn LP
        _burn(msg.sender, liquidityAmount);
        liquidity[msg.sender] = balanceOf(msg.sender); // mirror for compatibility

        // Update reserves
        reserveA -= amountA;
        reserveB -= amountB;

        // Transfer tokens back to user
        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);

        emit LiquidityRemoved(msg.sender, amountA, amountB, liquidityAmount);
    }

    /**
     * @notice Swap one token for another
     */
    function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut)
        external
        nonReentrant
        returns (uint256 amountOut)
    {
        // Accumulate TWAP with current reserves before changing state
        _updateCumulative();
        require(amountIn > 0, "Amount must be greater than 0");
        require(tokenIn == address(tokenA) || tokenIn == address(tokenB), "Invalid token");

        bool isTokenA = tokenIn == address(tokenA);
        (IERC20 tokenInContract, IERC20 tokenOutContract) = isTokenA ? (tokenA, tokenB) : (tokenB, tokenA);
        (uint256 reserveIn, uint256 reserveOut) = isTokenA ? (reserveA, reserveB) : (reserveB, reserveA);

        tokenInContract.transferFrom(msg.sender, address(this), amountIn);

        uint256 amountInWithFee = amountIn * (feeDenominator - feeNumerator);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * feeDenominator) + amountInWithFee;
        amountOut = numerator / denominator;

        require(amountOut > 0, "Insufficient output amount");
        require(amountOut < reserveOut, "Insufficient liquidity");
        require(amountOut >= minAmountOut, "Slippage exceeded");

        if (isTokenA) {
            reserveA += amountIn;
            reserveB -= amountOut;
        } else {
            reserveB += amountIn;
            reserveA -= amountOut;
        }

        tokenOutContract.transfer(msg.sender, amountOut);

        emit Swap(msg.sender, tokenIn, amountIn, amountOut);
    }

    /**
     * @notice Flash swap: borrow tokenOut, execute callback, and repay + fee within the same tx
     * @param tokenOut Address of token to borrow (must be tokenA or tokenB)
     * @param amountOut Amount to borrow
     * @param data Arbitrary data forwarded to receiver
     */
    function flashSwap(address tokenOut, uint256 amountOut, bytes calldata data) external nonReentrant {
        // Accumulate TWAP with current reserves before changing state
        _updateCumulative();

        require(amountOut > 0, "amount=0");
        require(tokenOut == address(tokenA) || tokenOut == address(tokenB), "Invalid token");

        IERC20 out = IERC20(tokenOut);
        uint256 beforeBal = out.balanceOf(address(this));
        require(beforeBal >= amountOut, "insufficient liquidity");

        // Send tokens to borrower (msg.sender)
        out.transfer(msg.sender, amountOut);

        // Execute callback
        IFlashSwapReceiver(msg.sender).onFlashSwap(data);

        // Compute fee and verify repayment
        uint256 fee = (amountOut * feeNumerator) / feeDenominator;
        uint256 afterBal = out.balanceOf(address(this));
        require(afterBal >= beforeBal + fee, "Flash swap not repaid");

        // Accrue fee to reserves
        if (tokenOut == address(tokenA)) {
            reserveA += fee;
        } else {
            reserveB += fee;
        }

        // Update fee distribution indices so LPs can claim proportionally
        uint256 ts = totalSupply();
        if (ts > 0) {
            if (tokenOut == address(tokenA)) {
                feePerLPTokenA += (fee * 1e18) / ts;
                emit FeesAccrued(address(tokenA), fee, feePerLPTokenA);
            } else {
                feePerLPTokenB += (fee * 1e18) / ts;
                emit FeesAccrued(address(tokenB), fee, feePerLPTokenB);
            }
        }

        emit FlashSwap(msg.sender, tokenOut, amountOut, fee);
    }

    /**
     * @notice Calculate swap output amount (view function)
     */
    function getSwapAmount(address tokenIn, uint256 amountIn) external view returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be greater than 0");
        require(tokenIn == address(tokenA) || tokenIn == address(tokenB), "Invalid token");

        bool isTokenA = tokenIn == address(tokenA);
        (uint256 reserveIn, uint256 reserveOut) = isTokenA ? (reserveA, reserveB) : (reserveB, reserveA);

        uint256 amountInWithFee = amountIn * (feeDenominator - feeNumerator);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * feeDenominator) + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /**
     * @notice Get current pool state
     */
    function getReserves() external view returns (uint256 _reserveA, uint256 _reserveB, uint256 _totalLiquidity) {
        return (reserveA, reserveB, totalSupply());
    }

    /**
     * @notice Get user's liquidity position (LP balance and share bps)
     */
    function getUserLiquidity(address user) external view returns (uint256 liquidityAmount, uint256 sharePercentage) {
        liquidityAmount = balanceOf(user);
        uint256 _totalSupply = totalSupply();
        sharePercentage = _totalSupply > 0 ? (liquidityAmount * 10000) / _totalSupply : 0;
    }

    /**
     * @notice Claim accumulated fees for both tokens based on current LP balance
     */
    function claimFees() external nonReentrant returns (uint256 amountA, uint256 amountB) {
        uint256 bal = balanceOf(msg.sender);
        require(bal > 0, "No LP balance");

        // Compute owed using index - debt model
        uint256 accruedA = (bal * feePerLPTokenA) / 1e18;
        uint256 accruedB = (bal * feePerLPTokenB) / 1e18;

        amountA = accruedA - feeDebtA[msg.sender];
        amountB = accruedB - feeDebtB[msg.sender];

        require(amountA > 0 || amountB > 0, "Nothing to claim");

        // Update debts to current index
        feeDebtA[msg.sender] = accruedA;
        feeDebtB[msg.sender] = accruedB;

        // Pay out and adjust reserves
        if (amountA > 0) {
            require(reserveA >= amountA, "Insufficient A reserve");
            reserveA -= amountA;
            tokenA.transfer(msg.sender, amountA);
        }
        if (amountB > 0) {
            require(reserveB >= amountB, "Insufficient B reserve");
            reserveB -= amountB;
            tokenB.transfer(msg.sender, amountB);
        }

        emit FeesClaimed(msg.sender, amountA, amountB);
    }

    function _updateFeeDebt(address account) internal {
        if (account == address(0)) return;
        uint256 bal = balanceOf(account);
        feeDebtA[account] = (bal * feePerLPTokenA) / 1e18;
        feeDebtB[account] = (bal * feePerLPTokenB) / 1e18;
        liquidity[account] = bal; // keep legacy mirror in sync
    }

    function _afterTokenTransfer(address from, address to, uint256 amount) internal override {
        super._afterTokenTransfer(from, to, amount);
        if (from != address(0)) _updateFeeDebt(from);
        if (to != address(0)) _updateFeeDebt(to);
    }

    function _mint(address to, uint256 amount) internal override {
        super._mint(to, amount);
        _updateFeeDebt(to);
    }

    function _burn(address from, uint256 amount) internal override {
        super._burn(from, amount);
        _updateFeeDebt(from);
    }

    /**
     * @notice Backwards-compatibility view: totalLiquidity equals ERC20 totalSupply
     */
    function totalLiquidity() external view returns (uint256) {
        return totalSupply();
    }

    /**
     * @notice Number of observations stored
     */
    function observationsLength() external view returns (uint256) {
        return observations.length;
    }

    /**
     * @notice TWAP over the last `secondsAgo` seconds for price of A in terms of B (1e18-scaled)
     * Uses the last two observations as a simple approximation if window exceeds last interval.
     */
    function consultTwapA(uint32 secondsAgo) external view returns (uint256 priceAvg) {
        if (observations.length < 2 || secondsAgo == 0) return 0;
        Observation memory lastObs = observations[observations.length - 1];
        Observation memory prevObs = observations[observations.length - 2];
        uint32 startTs = lastObs.timestamp > secondsAgo ? lastObs.timestamp - secondsAgo : prevObs.timestamp;
        uint256 window = uint256(lastObs.timestamp - startTs);
        if (window == 0) return 0;
        // Use delta cumulatives over available window (approx using prevObs as baseline)
        uint256 delta = lastObs.priceACumulative - prevObs.priceACumulative;
        uint256 interval = uint256(lastObs.timestamp - prevObs.timestamp);
        if (interval == 0) return 0;
        // Average over requested window approximated by last interval average
        uint256 avgLastInterval = delta / interval;
        return avgLastInterval;
    }

    /**
     * @notice TWAP over the last `secondsAgo` seconds for price of B in terms of A (1e18-scaled)
     */
    function consultTwapB(uint32 secondsAgo) external view returns (uint256 priceAvg) {
        if (observations.length < 2 || secondsAgo == 0) return 0;
        Observation memory lastObs = observations[observations.length - 1];
        Observation memory prevObs = observations[observations.length - 2];
        uint32 startTs = lastObs.timestamp > secondsAgo ? lastObs.timestamp - secondsAgo : prevObs.timestamp;
        uint256 window = uint256(lastObs.timestamp - startTs);
        if (window == 0) return 0;
        uint256 delta = lastObs.priceBCumulative - prevObs.priceBCumulative;
        uint256 interval = uint256(lastObs.timestamp - prevObs.timestamp);
        if (interval == 0) return 0;
        uint256 avgLastInterval = delta / interval;
        return avgLastInterval;
    }
}
