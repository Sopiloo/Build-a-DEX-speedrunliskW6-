"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { PriceDisplay } from "~~/components/example-ui/PriceDisplay";

const Oracle: NextPage = () => {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center">Live Price Feeds</h2>
            <p>Please connect your wallet to view live prices</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">🔮 Live Crypto Prices</h1>
        <p className="text-gray-600">Real-time cryptocurrency prices</p>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        <PriceDisplay symbol="ETH" />
        <PriceDisplay symbol="BTC" />
      </div>
    </div>
  );
};

export default Oracle;
