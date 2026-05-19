import type { Metadata } from 'next';
import { OrderList } from '@/features/orders';

interface OrdersPageProps {
  params: { id: string };
}

export const metadata: Metadata = { title: 'Patient Orders' };

export default function PatientOrdersPage({ params }: OrdersPageProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Orders</h2>
      <OrderList patientId={params.id} />
    </div>
  );
}
