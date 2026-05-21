import type { Metadata } from 'next';
import { ClipboardList } from 'lucide-react';
import { OrderList } from '@/features/orders';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Orders Queue' };

export default function OrdersQueuePage() {
  return (
    <div>
      <PageHeader
        title="Orders Queue"
        description="All pending and active clinical orders"
        icon={ClipboardList}
        iconColor="text-violet-600"
        iconBg="bg-violet-50"
      />
      <OrderList />
    </div>
  );
}
