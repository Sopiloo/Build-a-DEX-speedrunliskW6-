import { ethers } from "hardhat";
import { WrapperBuilder } from "@redstone-finance/evm-connector";

// Minimal ABI aligned with packages/hardhat/contracts/PriceFeed.sol
const PRICE_FEED_ABI = [
  "function getEthPrice() view returns (uint256)",
  "function getBtcPrice() view returns (uint256)",
  "function getMultiplePrices() view returns (uint256 ethPrice, uint256 btcPrice)",
];

async function main() {
  // Address from your logs (Lisk Sepolia)
  const PRICE_FEED_ADDRESS = "0x0C4Cd1093197D4B8Fe3F9284427cEF2DBd741346";

  console.log("Network:", (await ethers.provider.getNetwork()).name, (await ethers.provider.getNetwork()).chainId);

  // Use first signer for read context; for view calls, any provider/signer works
  const [signer] = await ethers.getSigners();
  const base = new ethers.Contract(PRICE_FEED_ADDRESS, PRICE_FEED_ABI, signer);

  // Modern RedStone config (SDK latest)
  const wrapped = WrapperBuilder.wrap(base as any).usingDataService({
    dataServiceId: "redstone-main-demo",
    uniqueSignersCount: 1,
    dataFeeds: [{ id: "ETH" }, { id: "BTC" }],
  } as any);

  // Read on-chain with payload
  console.log("Reading ETH...");
  const ethRaw = await wrapped.getEthPrice();
  console.log("Reading BTC...");
  let btcRaw: any = null;
  try {
    btcRaw = await wrapped.getBtcPrice();
  } catch (e) {
    console.warn("getBtcPrice failed (continuing):", e);
  }
  console.log("Reading tuple...");
  let tuple: any = null;
  try {
    tuple = await wrapped.getMultiplePrices();
  } catch (e) {
    console.warn("getMultiplePrices failed (continuing):", e);
  }

  const eth = Number(ethRaw) / 1e8;
  const btc = btcRaw != null ? Number(btcRaw) / 1e8 : NaN;
  const eth2 = tuple ? Number(tuple?.[0]) / 1e8 : NaN;
  const btc2 = tuple ? Number(tuple?.[1]) / 1e8 : NaN;

  console.log("ETH (USD):", isFinite(eth) ? eth.toFixed(2) : ethRaw.toString(), "| Tuple:", isFinite(eth2) ? eth2.toFixed(2) : String(tuple?.[0]));
  console.log("BTC (USD):", isFinite(btc) ? btc.toFixed(2) : btcRaw.toString(), "| Tuple:", isFinite(btc2) ? btc2.toFixed(2) : String(tuple?.[1]));
}

main().catch(err => {
  console.error("Oracle script failed:", err);
  process.exit(1);
});
