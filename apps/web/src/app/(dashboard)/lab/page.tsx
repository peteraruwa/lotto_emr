import { PageRoleGuard } from '@/shared/components/page-role-guard';
import { InvestigationsDashboard } from '@/features/investigations';

export default function LabPage() {
  return (
    <PageRoleGuard roles={['lab']}>
      <InvestigationsDashboard dept="lab" />
    </PageRoleGuard>
  );
}
