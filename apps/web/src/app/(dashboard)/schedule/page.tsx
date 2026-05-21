import type { Metadata } from 'next';
import { Calendar } from 'lucide-react';
import { AppointmentCalendar } from '@/features/scheduling';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Schedule' };

export default function SchedulePage() {
  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Manage appointments and availability"
        icon={Calendar}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
      />
      <AppointmentCalendar />
    </div>
  );
}
