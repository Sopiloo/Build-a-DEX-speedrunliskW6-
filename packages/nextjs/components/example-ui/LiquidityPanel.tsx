"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractRead, useScaffoldContractWrite, useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { useContractRead, useContractWrite, usePrepareContractWrite } from "wagmi";

export const LiquidityPanel = () => {
  const { address: connectedAddress } = useAccount();
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [removeAmount, setRemoveAmount] = useState("");
  const [isApprovedA, setIsApprovedA] = useState(false);
  const [isApprovedB, setIsApprovedB] = useState(false);
  const [tokenAInput, setTokenAInput] = useState<string>("");
  const [tokenBInput, setTokenBInput] = useState<string>("");
  const [selectedPair, setSelectedPair] = useState<`0x${string}` | undefined>(undefined);

  // Read deployed DEX address
  const { data: dexInfo } = useDeployedContractInfo("SimpleDEX");
  const dexAddress = dexInfo?.address as `0x${string}` | undefined;
  const dexAbi = dexInfo?.abi as any[] | undefined;

  // Factory
  const { data: factoryInfo } = useDeployedContractInfo("DEXFactory");
  const factoryAddress = factoryInfo?.address as `0x${string}` | undefined;

  // Get token addresses
  const { data: tokenAAddressDefault } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "tokenA",
  });

  const { data: tokenBAddressDefault } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "tokenB",
  });

  useEffect(() => {
    if (!tokenAInput && tokenAAddressDefault) setTokenAInput(tokenAAddressDefault as string);
    if (!tokenBInput && tokenBAddressDefault) setTokenBInput(tokenBAddressDefault as string);
  }, [tokenAAddressDefault, tokenBAddressDefault, tokenAInput, tokenBInput]);

  // Get reserves
  const { data: reservesDefault } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "getReserves",
  });

  const { data: reservesFromPair } = useContractRead({
    address: selectedPair,
    abi: dexAbi,
    functionName: "getReserves",
    enabled: !!selectedPair && !!dexAbi,
    watch: true,
  });

  const reserves = selectedPair ? (reservesFromPair as any) : (reservesDefault as any);

  const reserveA = reserves?.[0] || 0n;
  const reserveB = reserves?.[1] || 0n;
  const totalLiquidity = reserves?.[2] || 0n;

  // Get user liquidity
  const { data: userLiquidityDataDefault, refetch: refetchUserLiquidityDefault } = useScaffoldContractRead({
    contractName: "SimpleDEX",
    functionName: "getUserLiquidity",
    args: [connectedAddress],
  });

  const { data: userLiquidityDataFromPair, refetch: refetchUserLiquidityFromPair } = useContractRead({
    address: selectedPair,
    abi: dexAbi,
    functionName: "getUserLiquidity",
    args: [connectedAddress],
    enabled: !!selectedPair && !!dexAbi && !!connectedAddress,
    watch: true,
  });

  const userLiquidityData = (selectedPair ? userLiquidityDataFromPair : userLiquidityDataDefault) as any;
  const refetchUserLiquidity = selectedPair ? (refetchUserLiquidityFromPair as any) : refetchUserLiquidityDefault;

  const userLiquidity = userLiquidityData?.[0] || 0n;
  const userShareBasisPoints = userLiquidityData?.[1] || 0n;
  const userSharePercent = Number(userShareBasisPoints) / 100; // Convert basis points to percent

  // Get token balances
  const { data: balanceA } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const { data: balanceB } = useScaffoldContractRead({
    contractName: "SimpleUSDC",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  // Get token symbols
  const { data: symbolA } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "symbol",
  });

  const { data: symbolB } = useScaffoldContractRead({
    contractName: "SimpleUSDC",
    functionName: "symbol",
  });

  // Check approvals
  const spenderAddress = (selectedPair || dexAddress) as `0x${string}` | undefined;

  const { data: allowanceA, refetch: refetchAllowanceA } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "allowance",
    args: [connectedAddress, spenderAddress],
  });

  const { data: allowanceB, refetch: refetchAllowanceB } = useScaffoldContractRead({
    contractName: "SimpleUSDC",
    functionName: "allowance",
    args: [connectedAddress, spenderAddress],
  });

  // Update approval status
  useEffect(() => {
    if (amountA && amountB && allowanceA && allowanceB) {
      const amountABN = parseUnits(amountA, 18);
      const amountBBN = parseUnits(amountB, 6);
      setIsApprovedA(allowanceA >= amountABN);
      setIsApprovedB(allowanceB >= amountBBN);
    }
  }, [amountA, amountB, allowanceA, allowanceB]);

  // Approve functions (spender must be DEX)
  const { writeAsync: approveTokenA } = useScaffoldContractWrite({
    contractName: "MyToken",
    functionName: "approve",
    args: [spenderAddress, parseUnits("1000000", 18)],
  });

  const { writeAsync: approveTokenB } = useScaffoldContractWrite({
    contractName: "SimpleUSDC",
    functionName: "approve",
    args: [spenderAddress, parseUnits("1000000", 6)],
  });

  // Add liquidity
  const addArgs = [amountA ? parseUnits(amountA, 18) : 0n, amountB ? parseUnits(amountB, 6) : 0n] as const;

  const { config: addCfg } = usePrepareContractWrite({
    address: selectedPair,
    abi: dexAbi,
    functionName: "addLiquidity",
    args: addArgs,
    enabled: !!selectedPair && !!dexAbi,
  });
  const { writeAsync: addLiquidityWagmi } = useContractWrite(addCfg);
  const { writeAsync: addLiquidityScaffold } = useScaffoldContractWrite({
    contractName: "SimpleDEX",
    functionName: "addLiquidity",
    args: addArgs as any,
  });
  const addLiquidity = selectedPair ? addLiquidityWagmi : addLiquidityScaffold;

  // Remove liquidity
  const removeArgs = [removeAmount ? parseUnits(removeAmount, 18) : 0n] as const;
  const { config: removeCfg } = usePrepareContractWrite({
    address: selectedPair,
    abi: dexAbi,
    functionName: "removeLiquidity",
    args: removeArgs,
    enabled: !!selectedPair && !!dexAbi,
  });
  const { writeAsync: removeLiquidityWagmi } = useContractWrite(removeCfg);
  const { writeAsync: removeLiquidityScaffold } = useScaffoldContractWrite({
    contractName: "SimpleDEX",
    functionName: "removeLiquidity",
    args: removeArgs as any,
  });
  const removeLiquidity = selectedPair ? removeLiquidityWagmi : removeLiquidityScaffold;

  // Claim fees
  const { config: claimCfg } = usePrepareContractWrite({
    address: selectedPair,
    abi: dexAbi,
    functionName: "claimFees",
    enabled: !!selectedPair && !!dexAbi,
  });
  const { writeAsync: claimFeesWagmi } = useContractWrite(claimCfg);
  const { writeAsync: claimFeesScaffold } = useScaffoldContractWrite({
    contractName: "SimpleDEX",
    functionName: "claimFees",
  });
  const claimFees = selectedPair ? claimFeesWagmi : claimFeesScaffold;

  const handleApproveA = async () => {
    if (!dexAddress) {
      notification.error("DEX address unavailable. Ensure contracts are deployed and the app is connected to the correct network.");
      return;
    }
    try {
      await approveTokenA();
      notification.success("Token A approved!");
      setTimeout(() => refetchAllowanceA(), 2000);
    } catch (error) {
      console.error("Approval failed:", error);
      notification.error("Approval failed");
    }
  };

  const handleApproveB = async () => {
    if (!dexAddress) {
      notification.error("DEX address unavailable. Ensure contracts are deployed and the app is connected to the correct network.");
      return;
    }
    try {
      await approveTokenB();
      notification.success("Token B approved!");
      setTimeout(() => refetchAllowanceB(), 2000);
    } catch (error) {
      console.error("Approval failed:", error);
      notification.error("Approval failed");
    }
  };

  const handleAddLiquidity = async () => {
    if (!amountA || !amountB || parseFloat(amountA) <= 0 || parseFloat(amountB) <= 0) {
      notification.error("Enter valid amounts");
      return;
    }

    try {
      await addLiquidity();
      notification.success("Liquidity added!");
      setAmountA("");
      setAmountB("");
      setTimeout(() => refetchUserLiquidity(), 2000);
    } catch (error) {
      console.error("Add liquidity failed:", error);
      notification.error("Add liquidity failed");
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!removeAmount || parseFloat(removeAmount) <= 0) {
      notification.error("Enter valid amount");
      return;
    }

    try {
      await removeLiquidity();
      notification.success("Liquidity removed!");
      setRemoveAmount("");
      setTimeout(() => refetchUserLiquidity(), 2000);
    } catch (error) {
      console.error("Remove liquidity failed:", error);
      notification.error("Remove liquidity failed");
    }
  };

  const formatBalance = (balance: bigint | undefined, decimals: number) => {
    if (!balance) return "0.0";
    return parseFloat(formatUnits(balance, decimals)).toFixed(4);
  };

  // Calculate expected output for removing liquidity
  const expectedA =
    removeAmount && totalLiquidity > 0n
      ? (parseUnits(removeAmount, 18) * reserveA) / totalLiquidity
      : 0n;
  const expectedB =
    removeAmount && totalLiquidity > 0n
      ? (parseUnits(removeAmount, 18) * reserveB) / totalLiquidity
      : 0n;

  // Factory: get or create pair
  const { data: foundPair } = useScaffoldContractRead({
    contractName: "DEXFactory",
    functionName: "getPair",
    args: [tokenAInput || undefined, tokenBInput || undefined] as any,
    enabled: Boolean(tokenAInput && tokenBInput),
  });
  const { writeAsync: createPair } = useScaffoldContractWrite({
    contractName: "DEXFactory",
    functionName: "createPair",
    args: [tokenAInput || undefined, tokenBInput || undefined] as any,
  });

  const onFindPair = () => {
    if (foundPair && typeof foundPair === "string" && foundPair !== "0x0000000000000000000000000000000000000000") {
      setSelectedPair(foundPair as `0x${string}`);
      notification.success("Pair found and selected");
    } else {
      notification.info("No pair found for these tokens");
    }
  };

  const onCreatePair = async () => {
    try {
      if (!tokenAInput || !tokenBInput) {
        notification.error("Enter both token addresses");
        return;
      }
      const tx = await createPair();
      await tx?.wait?.();
      notification.success("Pair created. Click 'Find Pair' to select it.");
    } catch (e) {
      console.error(e);
      notification.error("Create pair failed");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Select or Create Pair</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="form-control">
              <label className="label"><span className="label-text">Token A</span></label>
              <input className="input input-bordered" placeholder="0x..." value={tokenAInput} onChange={e => setTokenAInput(e.target.value)} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Token B</span></label>
              <input className="input input-bordered" placeholder="0x..." value={tokenBInput} onChange={e => setTokenBInput(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-outline" onClick={onFindPair} disabled={!tokenAInput || !tokenBInput}>Find Pair</button>
              <button className="btn btn-secondary" onClick={onCreatePair} disabled={!tokenAInput || !tokenBInput}>Create Pair</button>
            </div>
          </div>
          {selectedPair && (
            <div className="mt-3 text-xs">
              Selected Pair: <span className="font-mono break-all">{selectedPair}</span>
            </div>
          )}
        </div>
      </div>
      {/* Pool Stats */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Pool Statistics {selectedPair ? "(Selected Pair)" : "(Default)"}</h2>
          <div className="stats stats-vertical lg:stats-horizontal shadow">
            <div className="stat">
              <div className="stat-title">Reserve {symbolA}</div>
              <div className="stat-value text-primary text-2xl">{formatBalance(reserveA, 18)}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Reserve {symbolB}</div>
              <div className="stat-value text-secondary text-2xl">{formatBalance(reserveB, 6)}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Your Share</div>
              <div className="stat-value text-accent text-2xl">{userSharePercent.toFixed(2)}%</div>
              <div className="stat-desc">{formatBalance(userLiquidity, 18)} LP tokens</div>
            </div>
          </div>
          <div className="card-actions justify-end mt-2">
            <button
              className="btn btn-outline"
              onClick={async () => {
                try {
                  await claimFees?.();
                  notification.success("Fees claimed");
                  setTimeout(() => {
                    refetchUserLiquidity?.();
                  }, 1500);
                } catch (e) {
                  console.error(e);
                  notification.error("Claim failed");
                }
              }}
            >
              Claim Fees
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Liquidity */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Add Liquidity</h2>

            {/* Token A Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">{symbolA} Amount</span>
                <span className="label-text-alt">Balance: {formatBalance(balanceA, 18)}</span>
              </label>
              <input
                type="number"
                placeholder="0.0"
                className="input input-bordered"
                value={amountA}
                onChange={e => setAmountA(e.target.value)}
              />
            </div>

            {/* Token B Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">{symbolB} Amount</span>
                <span className="label-text-alt">Balance: {formatBalance(balanceB, 6)}</span>
              </label>
              <input
                type="number"
                placeholder="0.0"
                className="input input-bordered"
                value={amountB}
                onChange={e => setAmountB(e.target.value)}
              />
            </div>

            {/* Pool Ratio Info */}
            {reserveA > 0n && reserveB > 0n && (
              <div className="alert alert-info">
                <span className="text-xs">
                  Current pool ratio: 1 {symbolA} ={" "}
                  {(Number(formatUnits(reserveB, 6)) / Number(formatUnits(reserveA, 18))).toFixed(4)} {symbolB}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="card-actions justify-end mt-4">
              {!isApprovedA && (
                <button className="btn btn-secondary btn-sm" onClick={handleApproveA}>
                  Approve {symbolA}
                </button>
              )}
              {!isApprovedB && (
                <button className="btn btn-secondary btn-sm" onClick={handleApproveB}>
                  Approve {symbolB}
                </button>
              )}
              {isApprovedA && isApprovedB && (
                <button
                  className="btn btn-primary btn-block"
                  onClick={handleAddLiquidity}
                  disabled={!amountA || !amountB}
                >
                  Add Liquidity
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Remove Liquidity */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Remove Liquidity</h2>

            {/* LP Token Input */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">LP Token Amount</span>
                <span className="label-text-alt">Available: {formatBalance(userLiquidity, 18)}</span>
              </label>
              <input
                type="number"
                placeholder="0.0"
                className="input input-bordered"
                value={removeAmount}
                onChange={e => setRemoveAmount(e.target.value)}
              />
            </div>

            {/* Expected Output */}
            {removeAmount && (
              <div className="alert alert-info">
                <div className="text-xs">
                  <p>You will receive:</p>
                  <p>
                    • {formatBalance(expectedA, 18)} {symbolA}
                  </p>
                  <p>
                    • {formatBalance(expectedB, 6)} {symbolB}
                  </p>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="card-actions justify-end mt-4">
              <button
                className="btn btn-error btn-block"
                onClick={handleRemoveLiquidity}
                disabled={!removeAmount || parseFloat(removeAmount) <= 0}
              >
                Remove Liquidity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
