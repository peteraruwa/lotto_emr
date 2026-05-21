import type { Metadata } from 'next';
import { UsersRound } from 'lucide-react';
import { EmployeeList } from '@/features/hr';
import { PageHeader } from '@/shared/components/page-header';

export const metadata: Metadata = { title: 'Employees' };

export default function HRPage() {
  return (
    <div>
      <PageHeader
        title="Employee Management"
        description="Register staff, manage accounts, and assign roles"
        icon={UsersRound}
      />
      <EmployeeList />
    </div>
  );
}
