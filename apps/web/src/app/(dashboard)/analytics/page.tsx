import type { Metadata } from 'next';
import { AnalyticsDashboard } from '@/features/analytics';

export const metadata: Metadata = { title: 'Analytics & Intelligence' };

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
