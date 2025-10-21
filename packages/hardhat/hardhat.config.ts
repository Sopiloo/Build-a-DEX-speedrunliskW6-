import * as dotenv from "dotenv";
dotenv.config();
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomicfoundation/hardhat-verify";
import "hardhat-deploy";
import "hardhat-deploy-ethers";

// Clés et paramètres
const providerApiKey = process.env.ALCHEMY_API_KEY || "XfdusSNUiY5U0K7InJ1-seBOjcY-lBQi";
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY ?? "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
// @ts-ignore
const etherscanApiKey = process.env.ETHERSCAN_API_KEY || "DNXJA8RX2Q3VZ4URQIWP7Z68CJXQZSC6AW";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  defaultNetwork: "localhost",
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`,
        enabled: process.env.MAINNET_FORKING_ENABLED === "true",
      },
    },
    mainnet: { url: `https://eth-mainnet.alchemyapi.io/v2/${providerApiKey}`, accounts: [deployerPrivateKey] },
    sepolia: { url: `https://eth-sepolia.g.alchemy.com/v2/${providerApiKey}`, accounts: [deployerPrivateKey] },
    liskSepolia: { url: "https://rpc.sepolia-api.lisk.com", accounts: [deployerPrivateKey], chainId: 4202 },
    // … autres réseaux ici …
  },
  etherscan: {
    apiKey: {
      liskSepolia: "unused", // Blockscout ignore la clé mais une string est requise
    },
    customChains: [
      {
        network: "liskSepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com",
        },
      },
    ],
  },
  verify: {
    etherscan: {
      apiKey: {
        liskSepolia: "unused",
      },
      customChains: [
        {
          network: "liskSepolia",
          chainId: 4202,
          urls: {
            apiURL: "https://sepolia-blockscout.lisk.com/api",
            browserURL: "https://sepolia-blockscout.lisk.com",
          },
        },
      ],
    },
  },
  sourcify: { enabled: false },
};

export default config;
