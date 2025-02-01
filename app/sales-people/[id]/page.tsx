import SalesPersonDetails from '@/app/components/SalesPersonDetails';

export default function SalesPersonPage({ params }: { params: { id: string } }) {
  return <SalesPersonDetails id={params.id} />;
} 