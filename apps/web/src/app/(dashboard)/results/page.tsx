import type { Metadata } from 'next';
import { ResultsList } from '@/features/results';

export const metadata: Metadata = { title: 'Results' };

export default function ResultsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Results</h1>
        <p className="text-muted-foreground text-sm">Lab results and diagnostic reports</p>
      </div>
      <ResultsList />
    </div>
  );
}
