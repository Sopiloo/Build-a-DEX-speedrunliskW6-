import { NextResponse } from "next/server";
import { ethers as ethers5 } from "ethers-v5";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { getSignersForDataServiceId } from "@redstone-finance/sdk";

const PRICE_FEED_ABI = [
  "function getEthPrice() view returns (uint256)",
  "function getBtcPrice() view returns (uint256)",
  "function getMultiplePrices() view returns (uint256 ethPrice, uint256 btcPrice)",
];

const PRICE_FEED_ADDRESS = "0x0C4Cd1093197D4B8Fe3F9284427cEF2DBd741346";

export async function GET() {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_LISK_RPC_URL || "https://rpc.sepolia-api.lisk.com";
    const provider = new ethers5.providers.JsonRpcProvider(rpcUrl);
    const base = new ethers5.Contract(PRICE_FEED_ADDRESS, PRICE_FEED_ABI, provider);

    let wrapped: any;
    const urls = [
      "https://oracle-gateway-1.a.redstone.finance",
      "https://oracle-gateway-2.a.redstone.finance",
      "https://oracle-gateway-3.a.redstone.finance",
    ];
    const feeds = ["ETH", "BTC"] as const;
    const buildModern = (serviceId: string, withUrls: boolean) =>
      WrapperBuilder.wrap(base as any).usingDataService({
        dataServiceId: serviceId,
        uniqueSignersCount: 1,
        dataFeeds: feeds as any,
        ...(withUrls ? { urls } : {}),
      } as any);

    const attempts: Array<{ sid: string; withUrls: boolean }> = [
      { sid: "redstone-main-demo", withUrls: true },
      { sid: "redstone-primary-prod", withUrls: true },
      { sid: "redstone-main-demo", withUrls: false },
    ];

    let lastErr: any = undefined;
    for (const a of attempts) {
      try {
        wrapped = buildModern(a.sid, a.withUrls);
        lastErr = undefined;
        break;
      } catch (e) {
        lastErr = e;
      }
    }

    if (!wrapped) {
      // Fallback to legacy signer-based config (older SDKs)
      try {
        const raw = getSignersForDataServiceId("redstone-main-demo");
        const authorizedSigners = Array.isArray(raw)
          ? raw
              .map((s: any) => (typeof s === "string" ? s : s?.address))
              .filter((x: any): x is string => typeof x === "string" && x.length > 0)
          : [];
        wrapped = WrapperBuilder.wrap(base as any).usingDataService({
          dataServiceId: "redstone-main-demo",
          dataPackagesIds: ["ETH", "BTC"],
          authorizedSigners,
          uniqueSignersCount: 1,
        } as any);
      } catch (eLegacy) {
        const msg = `Wrapper creation failed: modern attempts -> ${(lastErr as any)?.message}; legacy -> ${(eLegacy as any)?.message}`;
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    let ethRaw: any;
    try {
      ethRaw = await wrapped.getEthPrice();
    } catch (e) {
      // Retry with legacy wrapper
      try {
        const raw = getSignersForDataServiceId("redstone-main-demo");
        const authorizedSigners = Array.isArray(raw)
          ? raw
              .map((s: any) => (typeof s === "string" ? s : s?.address))
              .filter((x: any): x is string => typeof x === "string" && x.length > 0)
          : [];
        const legacy = WrapperBuilder.wrap(base as any).usingDataService({
          dataServiceId: "redstone-main-demo",
          dataPackagesIds: ["ETH", "BTC"],
          authorizedSigners,
          uniqueSignersCount: 1,
        } as any);
        ethRaw = await legacy.getEthPrice();
      } catch (eEthRetry) {
        return NextResponse.json(
          { error: `getEthPrice failed: modern+fallbacks->${(e as any)?.message}; legacy->${(eEthRetry as any)?.message}` },
          { status: 500 },
        );
      }
    }

    let btcRaw: any;
    try {
      btcRaw = await wrapped.getBtcPrice();
    } catch (e) {
      // Retry with legacy wrapper
      try {
        const raw = getSignersForDataServiceId("redstone-main-demo");
        const authorizedSigners = Array.isArray(raw)
          ? raw
              .map((s: any) => (typeof s === "string" ? s : s?.address))
              .filter((x: any): x is string => typeof x === "string" && x.length > 0)
          : [];
        const legacy = WrapperBuilder.wrap(base as any).usingDataService({
          dataPackagesIds: ["ETH", "BTC"],
          authorizedSigners,
          uniqueSignersCount: 1,
        } as any);
        btcRaw = await legacy.getBtcPrice();
      } catch (eBtcRetry) {
        return NextResponse.json(
          { error: `getBtcPrice failed: modern+fallbacks->${(e as any)?.message}; legacy->${(eBtcRetry as any)?.message}` },
          { status: 500 },
        );
      }
    }

    const eth = Number(ethRaw) / 1e8;
    const btc = Number(btcRaw) / 1e8;

    return NextResponse.json({ eth, btc });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || String(e) },
      { status: 500 },
    );
  }
}
