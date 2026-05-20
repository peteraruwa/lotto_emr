import type { Metadata } from 'next';
import { EmployeeList } from '@/features/hr';

export const metadata: Metadata = { title: 'Employees' };

export default function HRPage() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Employee Management</h1>
        <p className="text-muted-foreground text-sm">
          Register new staff, manage accounts, and assign system roles.
        </p>
      </div>
      <EmployeeList />
    </div>
  );
}
