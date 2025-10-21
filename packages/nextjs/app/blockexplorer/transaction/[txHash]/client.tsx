"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { NextPage } from "next";
import type { Transaction, TransactionReceipt } from "viem";
import { hardhat } from "viem/chains";
import { usePublicClient } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { decodeTransactionData } from "~~/utils/scaffold-eth";

type TransactionPageProps = {
  txData: any; // You might want to define a proper type for this
};

const TransactionPage: NextPage<TransactionPageProps> = ({ txData }: TransactionPageProps) => {
  const client = usePublicClient({ chainId: hardhat.id });
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction>();
  const [, setReceipt] = useState<TransactionReceipt>();
  const [, setFunctionCalled] = useState<string>();
  
  // Commented out unused network info
  // const { targetNetwork } = useTargetNetwork();

  useEffect(() => {
    if (txData?.txHash) {
      const fetchTransaction = async () => {
        try {
          const tx = await client.getTransaction({ hash: txData.txHash });
          const receipt = await client.getTransactionReceipt({ hash: txData.txHash });

          const transactionWithDecodedData = decodeTransactionData(tx);
          setTransaction(transactionWithDecodedData);
          setReceipt(receipt);

          const functionCalled = transactionWithDecodedData.input.substring(0, 10);
          setFunctionCalled(functionCalled);
        } catch (error) {
          console.error("Error fetching transaction:", error);
        }
      };

      fetchTransaction();
    }
  }, [client, txData?.txHash]);

  // Helper function to handle BigInt serialization
  const safeStringify = (obj: any) => {
    return JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value, 2
    );
  };

  return (
    <div className="container mx-auto p-6">
      <button className="btn btn-primary mb-4" onClick={() => router.back()}>
        Back
      </button>
      {transaction && (
        <div className="bg-base-100 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Transaction Details</h2>
          <pre className="whitespace-pre-wrap break-words">
            {safeStringify(transaction)}
          </pre>
        </div>
      )}
      {!transaction && (
        <div>Loading transaction data...</div>
      )}
    </div>
  );
};

export default TransactionPage;
