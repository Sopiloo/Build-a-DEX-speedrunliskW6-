import { notFound } from 'next/navigation';
import { TransactionDetails } from './TransactionDetails';

type PageProps = {
  params: { txHash?: string };
};

// Dynamic route configuration is in generateStaticParams.ts

export default function Page({ params }: PageProps) {
  if (!params?.txHash) {
    notFound();
  }

  return <TransactionDetails txHash={params.txHash} />;
}