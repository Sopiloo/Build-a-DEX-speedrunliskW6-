"use client";

import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

export const TokenBalance = () => {
  const { address: connectedAddress } = useAccount();

  const { data: tokenBalance } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const { data: tokenSymbol } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "symbol",
  });

  const { data: tokenName } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "name",
  });

  if (!connectedAddress) {
    return (
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Token Balance</h2>
          <p>Please connect your wallet to view token balance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">
          {tokenName} ({tokenSymbol})
        </h2>
        <div className="stats">
          <div className="stat">
            <div className="stat-title">Your Balance</div>
            <div className="stat-value text-primary">
              {tokenBalance ? (Number(tokenBalance) / 1e18).toFixed(4) : "0.0000"}
            </div>
            <div className="stat-desc">{tokenSymbol}</div>
          </div>
        </div>
        <div className="card-actions justify-end">
          <Address address={connectedAddress} />
        </div>
      </div>
    </div>
  );
};
