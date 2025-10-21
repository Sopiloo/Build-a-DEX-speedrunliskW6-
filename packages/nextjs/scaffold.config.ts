import { liskSepolia } from "./chains";
import * as chains from "viem/chains";

export type ScaffoldConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
  walletAutoConnect: boolean;
};

const scaffoldConfig = {
  // Target Lisk Sepolia as the main network
  targetNetworks: [liskSepolia],

  // Set polling interval to 15 seconds
  pollingInterval: 15000,

  // Use environment variables for sensitive data
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF",
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",

  // Disable burner wallet in production
  onlyLocalBurnerWallet: true,

  // Auto-connect wallet
  walletAutoConnect: true,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
