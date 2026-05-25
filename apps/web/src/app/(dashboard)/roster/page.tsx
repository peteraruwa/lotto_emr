import type { Metadata } from 'next';
import { RosterPage } from '@/features/roster';

export const metadata: Metadata = { title: 'Staff Roster' };

export default function StaffRosterPage() {
  return <RosterPage />;
}
