import type { Metadata } from 'next';
import { FlaskConical } from 'lucide-react';
import { ResultsList } from '@/features/results';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Results' };

export default function ResultsPage() {
  return (
    <div>
      <PageHeader
        title="Results"
        description="Lab results and diagnostic reports"
        icon={FlaskConical}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
      />
      <ResultsList />
    </div>
  );
}
