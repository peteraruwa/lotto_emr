import type { Metadata } from 'next';
import { ClinicalToolsPage } from '@/features/clinical-tools';

export const metadata: Metadata = { title: 'Clinical Tools' };

export default function ClinicalToolsRoute() {
  return <ClinicalToolsPage />;
}
