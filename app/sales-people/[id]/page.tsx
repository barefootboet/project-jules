import { Metadata } from 'next'
import SalesPersonDetails from '@/app/components/SalesPersonDetails';

type Props = {
  params: { id: string }
}

export const metadata: Metadata = {
  title: 'Sales Person Details',
}

export default async function SalesPersonPage({ params }: Props) {
  return (
    <SalesPersonDetails id={params.id} />
  );
}

// Generate static params if you have known IDs
export async function generateStaticParams() {
  // If you have a way to get all possible IDs, you can return them here
  // For now, returning empty array as data is client-side
  return []
} 