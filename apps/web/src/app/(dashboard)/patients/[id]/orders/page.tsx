import type { Metadata } from 'next';
import { OrderList } from '@/features/orders';
import { OrderBasket } from '@/features/billing';

interface OrdersPageProps {
  params: { id: string };
}

export const metadata: Metadata = { title: 'Patient Orders' };

export default function PatientOrdersPage({ params }: OrdersPageProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Orders</h2>
      <OrderBasket patientId={params.id} />
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-3">Order History</h3>
        <OrderList patientId={params.id} />
      </div>
    </div>
  );
}
