import type { Metadata } from 'next';
import { PharmacyDashboard } from '@/features/pharmacy';
import { PageRoleGuard } from '@/shared/components/page-role-guard';

export const metadata: Metadata = { title: 'Pharmacy — Medication Safety & Dispensing' };

export default function PharmacyPage() {
  return (
    <PageRoleGuard roles={['pharmacist']}>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <PharmacyDashboard />
      </div>
    </PageRoleGuard>
  );
}
