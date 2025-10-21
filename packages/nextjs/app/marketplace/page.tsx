"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { MarketplaceGrid } from "~~/components/example-ui/MarketplaceGrid";

const Marketplace: NextPage = () => {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center">NFT Marketplace</h2>
            <p>Please connect your wallet to browse the marketplace</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">🛒 NFT Marketplace</h1>
        <p className="text-center text-gray-600">
          Buy and sell NFTs with live USD price display powered by RedStone Oracle
        </p>
      </div>

      <MarketplaceGrid />
    </div>
  );
};

export default Marketplace;