"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

const Events: NextPage = () => {
  // State for managing the page
  const { isConnected } = useAccount();
  const [eventType, setEventType] = useState<"token" | "nft">("token");

  // Get token transfer events
  const { data: tokenEvents, isLoading: tokenLoading } = useScaffoldEventHistory({
    contractName: "MyToken",
    eventName: "Transfer",
    fromBlock: 0n,
    watch: true,
  });

  // Get NFT transfer events
  const { data: nftEvents, isLoading: nftLoading } = useScaffoldEventHistory({
    contractName: "MyNFT",
    eventName: "Transfer",
    fromBlock: 0n,
    watch: true,
  });

  // Determine which events to show based on selected tab
  const currentEvents = eventType === "token" ? tokenEvents || [] : nftEvents || [];
  const isLoading = eventType === "token" ? tokenLoading : nftLoading;

  // Show connection prompt if wallet not connected
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center">Contract Events</h2>
            <p>Please connect your wallet to view events</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">📜 Contract Events</h1>
          <p className="text-center text-gray-600">View transaction history for your contracts</p>
        </div>
      }

      {
        <div className="flex justify-center mb-6">
          <div className="tabs tabs-boxed">
            <button
              className={`tab ${eventType === "token" ? "tab-active" : ""}`}
              onClick={() => setEventType("token")}
            >
              Token Transfers ({tokenEvents?.length || 0})
            </button>
            <button className={`tab ${eventType === "nft" ? "tab-active" : ""}`} onClick={() => setEventType("nft")}>
              NFT Activity ({nftEvents?.length || 0})
            </button>
          </div>
        </div>
      }

      {
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">{eventType === "token" ? "🪙 Token Events" : "🎨 NFT Events"}</h2>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : currentEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No events found</p>
                <p className="text-sm">
                  {eventType === "token"
                    ? "Transfer some tokens to see events here"
                    : "Mint some NFTs to see events here"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>To</th>
                      <th>{eventType === "token" ? "Amount" : "Token ID"}</th>
                      <th>Block</th>
                      <th>Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEvents.slice(0, 20).map((event, index) => (
                      <tr key={`${event.log.transactionHash}-${index}`}>
                        <td>
                          <Address address={event.args.from} size="sm" />
                        </td>
                        <td>
                          <Address address={event.args.to} size="sm" />
                        </td>
                        <td>
                          {eventType === "token" ? (
                            <span className="font-mono">
                              {Number(formatEther(event.args[2] || 0n)).toFixed(4)} LSEA
                            </span>
                          ) : (
                            <span className="badge badge-primary">#{event.args[2]?.toString()}</span>
                          )}
                        </td>
                        <td>
                          <span className="text-sm">{event.log.blockNumber.toString()}</span>
                        </td>
                        <td>
                          <a
                            href={`https://sepolia-blockscout.lisk.com/tx/${event.log.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-xs btn-outline"
                          >
                            View →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      }
    </div>
  );
};

export default Events;