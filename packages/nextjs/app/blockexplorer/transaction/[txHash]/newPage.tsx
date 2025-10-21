import { notFound } from 'next/navigation';
import TransactionPage from './client';

type PageProps = {
  params: { txHash?: string };
};

// This function tells Next.js which dynamic routes to pre-render at build time
export async function generateStaticParams() {
  // Return an empty array to disable static generation for this route
  // or return a list of params to pre-render specific pages
  // Example: return [{ txHash: '0x123...' }, { txHash: '0x456...' }];
  return [];
}

// This tells Next.js that this is a dynamic route
export const dynamicParams = true; // true (default) means dynamic segments not included in generateStaticParams are generated on demand

export default function Page({ params }: PageProps) {
  if (!params?.txHash) {
    notFound();
  }

  return <TransactionPage txData={{ txHash: params.txHash }} />;
}
