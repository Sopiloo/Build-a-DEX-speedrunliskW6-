"use client";

import { useEffect } from "react";
import { InheritanceTooltip } from "./InheritanceTooltip";
import { displayTxResult } from "./utilsDisplay";
import { Abi, AbiFunction } from "abitype";
import { Address } from "viem";
import { useContractRead } from "wagmi";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useAnimationConfig } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

type DisplayVariableProps = {
  contractAddress: Address;
  abiFunction: AbiFunction;
  refreshDisplayVariables: boolean;
  inheritedFrom?: string;
  abi: Abi;
};

export const DisplayVariable = ({
  contractAddress,
  abiFunction,
  refreshDisplayVariables,
  abi,
  inheritedFrom,
}: DisplayVariableProps) => {
  const redstoneOnly: string[] = [
    "extractTimestampsAndAssertAllAreEqual",
  ].includes(abiFunction.name);

  const {
    data: result,
    isFetching,
    refetch,
  } = useContractRead({
    address: contractAddress,
    functionName: abiFunction.name,
    abi: abi,
    enabled: !redstoneOnly,
    onError: error => {
      notification.error(error.message);
    },
  });

  const { showAnimation } = useAnimationConfig(result);

  useEffect(() => {
    if (!redstoneOnly) {
      refetch();
    }
  }, [refetch, refreshDisplayVariables]);

  return (
    <div className="space-y-1 pb-2">
      <div className="flex items-center">
        <h3 className="font-medium text-lg mb-0 break-all">{abiFunction.name}</h3>
        <button className="btn btn-ghost btn-xs" disabled={redstoneOnly} onClick={async () => await refetch()}>
          {isFetching ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <ArrowPathIcon className="h-3 w-3 cursor-pointer" aria-hidden="true" />
          )}
        </button>
        <InheritanceTooltip inheritedFrom={inheritedFrom} />
      </div>
      <div className="text-gray-500 font-medium flex flex-col items-start">
        <div>
          {redstoneOnly ? (
            <div className="alert alert-info text-xs">
              <span>
                This function requires a RedStone payload and cannot be called from Debug. Use the Oracle page
                at <code className="bg-base-100 p-0.5 rounded">/oracle</code> to read it on-chain.
              </span>
            </div>
          ) : (
            <div
              className={`break-all block transition bg-transparent ${
                showAnimation ? "bg-warning rounded-sm animate-pulse-fast" : ""
              }`}
            >
              {displayTxResult(result)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
