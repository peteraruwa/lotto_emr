import type { Metadata } from 'next';
import { WardModuleDashboard } from '@/features/ward';

export const metadata: Metadata = { title: 'Ward' };

export default function WardPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <WardModuleDashboard />
    </div>
  );
}
