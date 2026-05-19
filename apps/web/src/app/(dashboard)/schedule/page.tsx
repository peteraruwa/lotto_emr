import type { Metadata } from 'next';
import { AppointmentCalendar } from '@/features/scheduling';

export const metadata: Metadata = { title: 'Schedule' };

export default function SchedulePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground text-sm">Manage appointments and slots</p>
      </div>
      <AppointmentCalendar />
    </div>
  );
}
