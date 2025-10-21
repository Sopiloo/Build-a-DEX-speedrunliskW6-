"use client";

import type { NextPage } from "next";
import { NFTCollection } from "~~/components/example-ui/NFTCollection";
import { TokenBalance } from "~~/components/example-ui/TokenBalance";
import { TokenTransfer } from "~~/components/example-ui/TokenTransfer";

const Home: NextPage = () => {
  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
        <div className="flex justify-center items-center gap-6 flex-col sm:flex-row">
          <div className="flex flex-col px-10 py-10 text-center items-center rounded-3xl">
            <TokenBalance />
          </div>
          <div className="flex flex-col px-10 py-10 text-center items-center rounded-3xl">
            <TokenTransfer />
          </div>
          <div className="flex flex-col px-10 py-10 text-center items-center rounded-3xl">
            <NFTCollection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
