'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Card, CardContent, Input, Label } from '@lotto-emr/ui';
import {
  employeeSchema,
  type EmployeeFormData,
  DEPARTMENTS,
  HOSPITAL_ROLES_FOR_STAFF,
} from '../schemas/employee.schema';
import { useCreateEmployee } from '../api/use-create-employee';

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara',
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="font-semibold text-sm text-gray-800 border-b pb-2">{title}</h3>
        {children}
      </CardContent>
    </Card>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SelectField({ id, options, placeholder, ...props }: any) {
  return (
    <select
      id={id}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o: any) =>
        typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
      )}
    </select>
  );
}

export function EmployeeForm() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateEmployee();
  const [apiError, setApiError]     = useState<string | null>(null);
  const [showPwd, setShowPwd]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { gender: 'male', systemRole: 'admin' },
  });

  async function onSubmit(data: EmployeeFormData) {
    setApiError(null);
    try {
      await mutateAsync(data);
      router.push('/hr');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to register employee. Please try again.';
      setApiError(msg);
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function onInvalid() {
    const first = document.querySelector('[aria-invalid="true"]') as HTMLElement | null;
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      {apiError && (
        <div ref={errorRef} className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
          <span className="text-red-500 text-lg leading-none">⚠</span>
          <div>
            <p className="text-sm font-medium text-red-800">Registration failed</p>
            <p className="text-xs text-red-700 mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* ── Personal Biodata ─────────────────────────────────── */}
      <Section title="Personal Biodata">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="First Name *" error={errors.firstName?.message}>
            <Input {...register('firstName')} placeholder="Emeka" aria-invalid={!!errors.firstName} />
          </Field>
          <Field label="Other Names" error={errors.otherNames?.message}>
            <Input {...register('otherNames')} placeholder="Chukwu" />
          </Field>
          <Field label="Last Name *" error={errors.lastName?.message}>
            <Input {...register('lastName')} placeholder="Okonkwo" aria-invalid={!!errors.lastName} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Date of Birth *" error={errors.dateOfBirth?.message}>
            <Input type="date" {...register('dateOfBirth')} aria-invalid={!!errors.dateOfBirth} />
          </Field>
          <Field label="Gender *" error={errors.gender?.message}>
            <SelectField
              {...register('gender')}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Field>
          <Field label="Phone *" error={errors.phone?.message}>
            <Input type="tel" {...register('phone')} placeholder="08012345678" aria-invalid={!!errors.phone} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Personal Email" error={errors.personalEmail?.message}>
            <Input type="email" {...register('personalEmail')} placeholder="personal@gmail.com" />
          </Field>
          <Field label="State of Origin">
            <SelectField {...register('state')} placeholder="Select state" options={NIGERIAN_STATES} />
          </Field>
        </div>

        <Field label="Home Address">
          <Input {...register('address')} placeholder="12 Adeola Odeku Street, VI" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Next of Kin Name">
            <Input {...register('nextOfKinName')} placeholder="Ngozi Okonkwo" />
          </Field>
          <Field label="Relationship">
            <Input {...register('nextOfKinRelationship')} placeholder="Spouse" />
          </Field>
          <Field label="Next of Kin Phone">
            <Input type="tel" {...register('nextOfKinPhone')} placeholder="08098765432" />
          </Field>
        </div>
      </Section>

      {/* ── Employment Details ────────────────────────────────── */}
      <Section title="Employment Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Department *" error={errors.department?.message}>
            <SelectField
              {...register('department')}
              placeholder="Select department"
              options={DEPARTMENTS}
              aria-invalid={!!errors.department}
            />
          </Field>
          <Field label="Job Title *" error={errors.jobTitle?.message}>
            <Input {...register('jobTitle')} placeholder="Consultant Physician" aria-invalid={!!errors.jobTitle} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Qualification / Specialty">
            <Input {...register('qualification')} placeholder="MBBS, FWACP — Internal Medicine" />
          </Field>
          <Field label="Date of Employment *" error={errors.dateOfEmployment?.message}>
            <Input type="date" {...register('dateOfEmployment')} aria-invalid={!!errors.dateOfEmployment} />
          </Field>
        </div>

        <Field label="Staff ID (leave blank to auto-generate)">
          <Input {...register('employeeId')} placeholder="LCH-2025-00001" className="font-mono" />
        </Field>
      </Section>

      {/* ── System Account ────────────────────────────────────── */}
      <Section title="System Account">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          These credentials will be used to log in to the EMR system. The employee must change their password on first login.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Login Email (username) *" error={errors.loginEmail?.message}>
            <Input
              type="email"
              {...register('loginEmail')}
              placeholder="dr.okonkwo@lotto-hospital.ng"
              aria-invalid={!!errors.loginEmail}
            />
          </Field>
          <Field label="System Role *" error={errors.systemRole?.message}>
            <SelectField
              {...register('systemRole')}
              placeholder="Select role"
              options={HOSPITAL_ROLES_FOR_STAFF}
              aria-invalid={!!errors.systemRole}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Password *" error={errors.password?.message}>
            <div className="relative">
              <Input
                type={showPwd ? 'text' : 'password'}
                {...register('password')}
                placeholder="Min. 8 characters"
                className="pr-10"
                aria-invalid={!!errors.password}
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Field label="Confirm Password *" error={errors.confirmPassword?.message}>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder="Repeat password"
                className="pr-10"
                aria-invalid={!!errors.confirmPassword}
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
        </div>
      </Section>

      <div className="flex justify-end gap-3 pb-6">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Creating account…' : 'Register Employee'}
        </Button>
      </div>
    </form>
  );
}
