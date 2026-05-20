import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { EmployeeForm } from '@/features/hr';

export const metadata: Metadata = { title: 'Register Employee' };

export default function NewEmployeePage() {
  return (
    <div className="max-w-3xl space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Link href="/hr" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Employees
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Register New Employee</h1>
        <p className="text-muted-foreground text-sm">
          Complete all sections. A staff ID and system account will be created automatically.
        </p>
      </div>
      <EmployeeForm />
    </div>
  );
}
