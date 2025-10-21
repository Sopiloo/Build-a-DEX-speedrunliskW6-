"use client";
import React, { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Logo } from "./Logo";
import {
  Bars3Icon,
  BugAntIcon,
  CurrencyDollarIcon,
  HomeIcon,
  ShoppingCartIcon,
  SparklesIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import {
  DappConsoleButton,
  FaucetButton,
  SuperchainFaucetButton,
} from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";
import { cn } from "~~/utils/cn";

const RainbowButton = dynamic(
  () => import("~~/components/scaffold-eth").then(m => m.RainbowKitCustomConnectButton),
  { ssr: false },
);

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  { label: "Home", href: "/", icon: <HomeIcon className="h-4 w-4" /> },
  { label: "Debug Contracts", href: "/debug", icon: <BugAntIcon className="h-4 w-4" /> },
  { label: "Events", href: "/events" },
  { label: "Block Explorer", href: "/blockexplorer" },
  { label: "Oracle", href: "/oracle", icon: <CurrencyDollarIcon className="h-4 w-4" /> },
  { label: "Gasless", href: "/gasless", icon: <SparklesIcon className="h-4 w-4" /> },
  { label: "Marketplace", href: "/marketplace", icon: <ShoppingCartIcon className="h-4 w-4" /> },
  { label: "DEX", href: "/dex", icon: <ArrowsRightLeftIcon className="h-4 w-4" /> },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();
  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={cn(
                "relative flex items-center justify-between px-4 py-2 text-sm transition-colors duration-200",
                isActive ? "bg-base-100 primary-content" : "text-slate-400",
              )}
            >
              {icon}
              {label}
            </Link>
          </li>
        );
      })}
    </>
  );
};

export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  return (
    <header className="sticky top-0 z-50 border-b border-base-300 bg-base-100 shadow-sm">
      <div className="navbar max-w-7xl mx-auto px-4">
        {/* Logo et navigation principale */}
        <div className="flex-1">
          <div className="lg:hidden">
            <label
              tabIndex={0}
              className="btn btn-ghost btn-circle"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            >
              <Bars3Icon className="h-5 w-5" />
            </label>
          </div>
          <Link href="/" className="flex items-center gap-2 ml-2 lg:ml-0">
            <div className="w-8 h-8">
              <Logo size={24} />
            </div>
            <div className="hidden md:flex flex-col">
              <span className="font-bold text-lg">Scaffold-Lisk</span>
              <span className="text-xs text-gray-500">Ethereum dev stack</span>
            </div>
          </Link>
          
          {/* Navigation desktop */}
          <div className="hidden lg:flex ml-6">
            <div className="dropdown dropdown-hover">
              <label tabIndex={0} className="btn btn-ghost btn-sm rounded-btn">
                Pages
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-56 border border-base-300 mt-2 z-50"
              >
                <HeaderMenuLinks />
              </ul>
            </div>
          </div>
        </div>

        {/* Actions utilisateur */}
        <div className="flex-none gap-2">
          {pathname !== "/gasless" && (
            <div className="hidden md:flex items-center gap-2">
              <RainbowButton />
              <div className="divider divider-horizontal mx-1" />
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button
              className="btn btn-xs btn-outline normal-case"
              onClick={async () => {
                try {
                  await (window as any)?.ethereum?.request?.({
                    method: "wallet_addEthereumChain",
                    params: [
                      {
                        chainId: "0x106A",
                        chainName: "Lisk Sepolia Testnet",
                        rpcUrls: ["https://rpc.sepolia-api.lisk.com"],
                        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                        blockExplorerUrls: ["https://sepolia-blockscout.lisk.com"],
                      },
                    ],
                  });
                } catch (e) {
                  console.error("add chain failed", e);
                }
              }}
            >
              Switch to Lisk Sepolia
            </button>
            <FaucetButton />
            <SuperchainFaucetButton />
            <DappConsoleButton />
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {isDrawerOpen && (
        <div className="lg:hidden bg-base-200">
          <ul className="menu p-4 w-full">
            <HeaderMenuLinks />
          </ul>
        </div>
      )}
    </header>
  );
};
