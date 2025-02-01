import { Metadata } from 'next'
import SalesPersonDetails from '@/app/components/SalesPersonDetails';

interface PageProps {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export const metadata: Metadata = {
  title: 'Sales Person Details',
}

export default function SalesPersonPage({ params }: PageProps) {
  return <SalesPersonDetails id={params.id} />;
} 