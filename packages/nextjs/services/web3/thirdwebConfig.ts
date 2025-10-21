import { createThirdwebClient } from "thirdweb";

export const thirdwebClient = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Minimal chain object for Lisk Sepolia compatible with thirdweb usage in this app
// Cast to any to avoid strict type coupling with thirdweb chain types
export const liskSepoliaThirdweb: any = {
  id: 4202,
  name: "Lisk Sepolia Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpc: process.env.NEXT_PUBLIC_LISK_RPC_URL || "https://rpc.sepolia-api.lisk.com",
  testnet: true,
};