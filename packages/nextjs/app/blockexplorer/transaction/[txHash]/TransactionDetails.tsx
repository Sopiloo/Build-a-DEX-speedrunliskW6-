"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Transaction, TransactionReceipt } from "viem";
import { hardhat } from "viem/chains";
import { usePublicClient } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { decodeTransactionData } from "~~/utils/scaffold-eth";

type TransactionDetailsProps = {
  txHash: string;
};

export const TransactionDetails = ({ txHash }: TransactionDetailsProps) => {
  const client = usePublicClient({ chainId: hardhat.id });
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction>();
  const [, setReceipt] = useState<TransactionReceipt>();

  useEffect(() => {
    if (txHash) {
      const fetchTransaction = async () => {
        const tx = await client.getTransaction({ hash: txHash as `0x${string}` });
        const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
        
        const transactionWithDecodedData = decodeTransactionData(tx);
        setTransaction(transactionWithDecodedData);
        setReceipt(receipt);
      };

      fetchTransaction();
    }
  }, [client, txHash]);

  if (!transaction) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto mt-10 mb-20 px-10 md:px-0">
      <button className="btn btn-sm btn-primary" onClick={() => router.back()}>
        Back
      </button>
      <div className="mt-8">
        <h1 className="text-2xl font-bold mb-4">Transaction Details</h1>
        <div className="bg-base-100 rounded-lg shadow p-6">
          <pre className="whitespace-pre-wrap break-words">
            {JSON.stringify(transaction, (key, value) => 
              typeof value === 'bigint' ? value.toString() : value, 2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
};