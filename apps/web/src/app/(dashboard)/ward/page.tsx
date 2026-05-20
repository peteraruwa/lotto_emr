import type { Metadata } from 'next';
import { WardDashboard } from '@/features/ward';

export const metadata: Metadata = { title: 'Ward' };

export default function WardPage() {
  return <WardDashboard />;
}
