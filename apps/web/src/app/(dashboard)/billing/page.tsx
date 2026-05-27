import type { Metadata } from 'next';
import { BillingControlTower } from '@/features/billing-hmo';
import { PageRoleGuard } from '@/shared/components/page-role-guard';

export const metadata: Metadata = { title: 'Billing & HMO — Control Tower' };

export default function BillingPage() {
  return (
    <PageRoleGuard roles={['billing']}>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <BillingControlTower />
      </div>
    </PageRoleGuard>
  );
}
