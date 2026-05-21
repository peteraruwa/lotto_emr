import type { Metadata } from 'next';
import { BillingDashboard } from '@/features/billing';

export const metadata: Metadata = { title: 'Billing & Authorization' };

export default function BillingPage() {
  return <BillingDashboard />;
}
