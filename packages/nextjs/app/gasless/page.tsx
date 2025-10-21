"use client";

import type { NextPage } from "next";
import { ConnectButton } from "thirdweb/react";
import { liskSepoliaThirdweb, thirdwebClient } from "~~/services/web3/thirdwebConfig";
import { SmartWalletDemo } from "~~/components/example-ui/SmartWalletDemo";
import { ThirdwebProviderWrapper } from "~~/components/thirdweb/ThirdwebProviderWrapper";
import { useActiveAccount } from "thirdweb/react";

const Gasless: NextPage = () => {
  return (
    <ThirdwebProviderWrapper
      client={thirdwebClient}
      supportedChains={[liskSepoliaThirdweb]}
      accountAbstraction={{ chain: liskSepoliaThirdweb as any, sponsorGas: true }}
    >
      <GaslessInner />
    </ThirdwebProviderWrapper>
  );
};

function GaslessInner() {
  const account = useActiveAccount();

  return (
    <div className="min-h-screen flex flex-col items-center bg-base-200 p-4 pt-12">
      {/* Header Section */}
      <header className="w-full max-w-4xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-bold mb-3">⛽ Gasless Transactions</h1>
        <p className="text-lg text-gray-600">Powered by ERC-4337 Smart Wallets - Pay $0 in gas fees!</p>
      </header>

      {/* Connect Button Section */}
      <div className="w-full max-w-4xl mx-auto mb-8">
        <div className="flex justify-center">
          <div className="relative z-10">
            <ConnectButton
              client={thirdwebClient}
              chain={liskSepoliaThirdweb as any}
              accountAbstraction={{
                chain: liskSepoliaThirdweb as any,
                sponsorGas: true,
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-4xl mx-auto">
        {account ? (
          <div className="mt-8">
            <SmartWalletDemo />
          </div>
        ) : (
          <div className="card bg-base-100 shadow-xl w-full max-w-md mx-auto">
            <div className="card-body items-center text-center p-6">
              <h2 className="card-title text-2xl mb-3">Create a Smart Wallet</h2>
              <p className="mb-4">Connect your wallet to create your gasless Smart Wallet!</p>
              <div className="alert alert-info">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div className="text-left">
                  <div className="text-sm">Smart Wallets are deployed on-chain automatically</div>
                  <div className="text-xs opacity-80">All transactions are sponsored and gas-free!</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Gasless;