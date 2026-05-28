import { PageRoleGuard } from '@/shared/components/page-role-guard';
import { InvestigationsDashboard } from '@/features/investigations';

export default function RadiologyPage() {
  return (
    <PageRoleGuard roles={['radiologist']}>
      <InvestigationsDashboard dept="radiology" />
    </PageRoleGuard>
  );
}
