"use client";

import { useEffect, useState } from "react";
// Client now calls our server API which performs the on-chain RedStone read

// Minimal ABI for PriceFeed
const PRICE_FEED_ABI = [
  "function getEthPrice() view returns (uint256)",
  "function getBtcPrice() view returns (uint256)",
  // PriceFeed.sol returns a tuple of (ethPrice, btcPrice)
  "function getMultiplePrices() view returns (uint256 ethPrice, uint256 btcPrice)",
];

export const OracleOnchain = () => {
  const [ethPrice, setEthPrice] = useState<string>("-");
  const [btcPrice, setBtcPrice] = useState<string>("-");
  const [error, setError] = useState<string>("");
  const [multi, setMulti] = useState<{ label: string; value: string }[] | null>(null);

  // Deployed PriceFeed on Lisk Sepolia (from your logs)
  const PRICE_FEED_ADDRESS = "0x0C4Cd1093197D4B8Fe3F9284427cEF2DBd741346" as const;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setError("");
      try {
        const res = await fetch("/api/oracle/prices", { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `API /api/oracle/prices failed with ${res.status}`);
        }
        const data = await res.json();

        if (cancelled) return;
        const eth = Number(data?.eth);
        const btc = Number(data?.btc);
        setEthPrice(Number.isFinite(eth) ? eth.toFixed(2) : "-");
        setBtcPrice(Number.isFinite(btc) ? btc.toFixed(2) : "-");
        setMulti([
          { label: "ETH", value: Number.isFinite(eth) ? eth.toFixed(2) : "-" },
          { label: "BTC", value: Number.isFinite(btc) ? btc.toFixed(2) : "-" },
        ]);
      } catch (e: any) {
        if (cancelled) return;
        console.error("OracleOnchain error", e);
        // Surface a shorter message but still helpful
        const msg = typeof e?.message === "string" ? e.message : String(e);
        setError(msg);
      }
    };

    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">RedStone On-chain Prices</h2>
        {error && (
          <div className="alert alert-warning text-xs">
            <span>On-chain read failed: {error}</span>
          </div>
        )}
        <div className="stats stats-vertical lg:stats-horizontal shadow">
          <div className="stat">
            <div className="stat-title">ETH (USD)</div>
            <div className="stat-value">{ethPrice}</div>
          </div>
          <div className="stat">
            <div className="stat-title">BTC (USD)</div>
            <div className="stat-value">{btcPrice}</div>
          </div>
        </div>
        {multi && (
          <div className="mt-3">
            <div className="text-sm font-semibold mb-1">Multiple Prices</div>
            <div className="text-xs opacity-80 break-all">
              [
              {multi.map((m, idx) => (
                <span key={idx}>{m.label}:{" "}{m.value}{idx < multi.length - 1 ? ", " : ""}</span>
              ))}
              ]
            </div>
          </div>
        )}
        <div className="text-xs opacity-70 mt-2">Reads are wrapped with RedStone EVM connector to attach signed payloads.</div>
      </div>
    </div>
  );
}
