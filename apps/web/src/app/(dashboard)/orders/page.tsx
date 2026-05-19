import type { Metadata } from 'next';
import { OrderList } from '@/features/orders';

export const metadata: Metadata = { title: 'Orders Queue' };

export default function OrdersQueuePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Orders Queue</h1>
        <p className="text-muted-foreground text-sm">All pending and active orders</p>
      </div>
      <OrderList />
    </div>
  );
}
