"use client";

import { useEffect, useState } from "react";

type PriceDisplayProps = {
  symbol: "ETH" | "BTC" | string;
};

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ symbol }) => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchPrice = async () => {
      setLoading(true);
      setError(null);
      try {
        const coinId = symbol.toLowerCase() === 'btc' ? 'bitcoin' : 'ethereum';
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
        
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        const val = data?.[coinId]?.usd;
        
        if (typeof val === 'number' && !Number.isNaN(val)) {
          if (!cancelled) setPrice(val);
        } else {
          throw new Error("Invalid price data received");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to fetch price");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPrice();
    const id = setInterval(fetchPrice, 20_000); // refresh every 20s
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol]);

  return (
    <div className="card w-64 bg-base-100 shadow-xl">
      <div className="card-body items-center text-center">
        <h2 className="card-title">{symbol}/USD</h2>
        {loading ? (
          <span className="loading loading-spinner loading-md" />
        ) : error ? (
          <div className="text-error text-sm">{error}</div>
        ) : price !== null ? (
          <div className="text-2xl font-bold">${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
        ) : (
          <div className="text-sm">No data</div>
        )}
      </div>
    </div>
  );
};
