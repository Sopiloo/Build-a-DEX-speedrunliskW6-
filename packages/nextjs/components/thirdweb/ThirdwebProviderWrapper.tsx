"use client";

import React from "react";
import { ThirdwebProvider as TWProvider } from "thirdweb/react";

export type ThirdwebProviderWrapperProps = {
  client: any;
  supportedChains?: any[];
  accountAbstraction?: any;
  children: React.ReactNode;
};

export function ThirdwebProviderWrapper(props: ThirdwebProviderWrapperProps) {
  return <TWProvider {...(props as any)}>{props.children}</TWProvider>;
}
