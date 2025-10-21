"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { NFTCard } from "./NFTCard";

export const MarketplaceGrid = () => {
  const { address: connectedAddress } = useAccount();
  const [nftIds, setNftIds] = useState<number[]>([]);

  const { data: totalSupply } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "totalSupply",
  });

  useEffect(() => {
    if (totalSupply) {
      const supply = Number(totalSupply);
      const ids = Array.from({ length: supply }, (_, i) => i);
      setNftIds(ids);
    }
  }, [totalSupply]);

  if (!connectedAddress) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Connect your wallet to view the marketplace</p>
      </div>
    );
  }

  if (nftIds.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No NFTs minted yet!</p>
        <p className="text-sm text-gray-400">Go to the Home page to mint some NFTs first</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {nftIds.map(tokenId => (
        <NFTCard key={tokenId} tokenId={tokenId} />
      ))}
    </div>
  );
};
