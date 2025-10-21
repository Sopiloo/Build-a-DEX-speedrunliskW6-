"use client";

import { useState } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { prepareTransaction } from "thirdweb";
import { liskSepoliaThirdweb, thirdwebClient } from "~~/services/web3/thirdwebConfig";

export const SmartWalletDemo: React.FC = () => {
  const account = useActiveAccount();
  const [status, setStatus] = useState<string>("");
  const { mutateAsync: sendTx, isPending } = useSendTransaction();

  const sendTestTx = async () => {
    try {
      setStatus("Sending...");
      // Send a 0-value tx to self as a demo (sponsored if AA is configured)
      const tx = await prepareTransaction({
        to: account?.address as `0x${string}`,
        chain: liskSepoliaThirdweb,
        client: thirdwebClient,
        value: 0n,
      });
      await sendTx(tx);
      setStatus("Success!");
    } catch (e: any) {
      setStatus(e?.message || "Failed");
    }
  };

  if (!account) {
    return null;
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <h2 className="card-title text-2xl mb-4">Smart Wallet</h2>
          <div className="bg-base-200 p-3 rounded-lg w-full mb-6">
            <div className="text-sm font-mono break-all">{account.address}</div>
          </div>
          <button 
            className="btn btn-primary w-full max-w-xs" 
            onClick={sendTestTx} 
            disabled={isPending}
          >
            {isPending ? (
              <span className="loading loading-spinner"></span>
            ) : (
              "Send Sponsored Tx"
            )}
          </button>
          {status && (
            <div className={`mt-4 text-sm ${status === 'Success!' ? 'text-success' : 'text-error'}`}>
              {status}
            </div>
          )}
          <div className="mt-4 text-xs text-gray-500">
            This transaction is sponsored and won't cost you any gas!
          </div>
        </div>
      </div>
    </div>
  );
}
