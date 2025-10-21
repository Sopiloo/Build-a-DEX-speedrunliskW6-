"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const NFTCollection = () => {
  const { address: connectedAddress } = useAccount();
  const [mintToAddress, setMintToAddress] = useState("");

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only update if it's a valid address or empty
    if (value === "" || value.startsWith("0x")) {
      setMintToAddress(value);
    }
  };

  const { data: nftName } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "name",
  });

  const { data: nftSymbol } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "symbol",
  });

  const { data: totalSupply } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "totalSupply",
  });

  const { data: userBalance } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "balanceOf",
    args: [connectedAddress as `0x${string}`],
  });

  const { writeAsync: writeMyNFTAsync } = useScaffoldContractWrite({
    contractName: "MyNFT",
    functionName: "mint",
    args: [(mintToAddress || connectedAddress) as `0x${string}`],
  });

  const handleMint = async () => {
    const targetAddress = (mintToAddress || connectedAddress) as `0x${string}`;

    if (!targetAddress) {
      notification.error("Please connect wallet or specify address");
      return;
    }

    try {
      await writeMyNFTAsync({
        args: [targetAddress],
      });

      notification.success("NFT minted successfully!");
      setMintToAddress("");
    } catch (error) {
      console.error("Mint failed:", error);
      notification.error("Minting failed. Please try again.");
    }
  };

  if (!connectedAddress) {
    return (
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">NFT Collection</h2>
          <p>Please connect your wallet to view and mint NFTs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">
          {nftName} ({nftSymbol})
        </h2>

        <div className="stats">
          <div className="stat">
            <div className="stat-title">Total Minted</div>
            <div className="stat-value text-secondary">{totalSupply?.toString() || "0"}</div>
          </div>
          <div className="stat">
            <div className="stat-title">You Own</div>
            <div className="stat-value text-accent">{userBalance?.toString() || "0"}</div>
          </div>
        </div>

        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">Mint to address (leave empty for yourself)</span>
          </label>
          <input
            type="text"
            placeholder="0x... or leave empty"
            className="input input-bordered w-full max-w-xs"
            value={mintToAddress}
            onChange={handleAddressChange}
          />
        </div>

        <div className="card-actions justify-end">
          <button className="btn btn-primary" onClick={handleMint}>
            Mint NFT
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <Address address={connectedAddress} />
        </div>
      </div>
    </div>
  );
}
