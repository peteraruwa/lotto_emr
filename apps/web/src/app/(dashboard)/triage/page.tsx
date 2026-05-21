import type { Metadata } from 'next';
import { TriageQueueTable } from '@/features/triage';

export const metadata: Metadata = { title: 'Triage Queue' };

export default function TriageQueuePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Triage Queue</h1>
      <TriageQueueTable />
    </div>
  );
}
