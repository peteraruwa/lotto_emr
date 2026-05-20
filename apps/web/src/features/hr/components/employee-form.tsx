'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
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

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

const DOCTOR_DEFAULTS: EmployeeFormData = {
  firstName:            'Chukwuemeka',
  lastName:             'Okonkwo',
  otherNames:           'David',
  dateOfBirth:          '1985-03-14',
  gender:               'male',
  phone:                '08012345678',
  personalEmail:        'emeka.okonkwo@gmail.com',
  address:              '12 Adeola Hopewell Street, Victoria Island',
  state:                'Lagos',
  nextOfKinName:        'Ngozi Okonkwo',
  nextOfKinPhone:       '08098765432',
  nextOfKinRelationship:'Spouse',
  department:           'Clinical',
  jobTitle:             'Senior Medical Officer',
  qualification:        'MBBS (University of Lagos), FMCP Internal Medicine',
  dateOfEmployment:     '2026-05-20',
  employeeId:           '',
  loginEmail:           'dr.okonkwo@lotto-hospital.ng',
  password:             'Doctor@2026!',
  confirmPassword:      'Doctor@2026!',
  systemRole:           'doctor',
};

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

export function EmployeeForm() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateEmployee();
  const [apiError, setApiError]       = useState<string | null>(null);
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const { register, control, handleSubmit, formState: { errors } } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: DOCTOR_DEFAULTS,
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
            <Input {...register('firstName')} aria-invalid={!!errors.firstName} />
          </Field>
          <Field label="Other Names" error={errors.otherNames?.message}>
            <Input {...register('otherNames')} />
          </Field>
          <Field label="Last Name *" error={errors.lastName?.message}>
            <Input {...register('lastName')} aria-invalid={!!errors.lastName} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Date of Birth *" error={errors.dateOfBirth?.message}>
            <Input type="date" {...register('dateOfBirth')} aria-invalid={!!errors.dateOfBirth} />
          </Field>
          <Field label="Gender *" error={errors.gender?.message}>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <select {...field} className={SELECT_CLASS} aria-invalid={!!errors.gender}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              )}
            />
          </Field>
          <Field label="Phone *" error={errors.phone?.message}>
            <Input type="tel" {...register('phone')} aria-invalid={!!errors.phone} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Personal Email" error={errors.personalEmail?.message}>
            <Input type="email" {...register('personalEmail')} />
          </Field>
          <Field label="State of Origin">
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <select {...field} className={SELECT_CLASS}>
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            />
          </Field>
        </div>

        <Field label="Home Address">
          <Input {...register('address')} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Next of Kin Name">
            <Input {...register('nextOfKinName')} />
          </Field>
          <Field label="Relationship">
            <Input {...register('nextOfKinRelationship')} />
          </Field>
          <Field label="Next of Kin Phone">
            <Input type="tel" {...register('nextOfKinPhone')} />
          </Field>
        </div>
      </Section>

      {/* ── Employment Details ────────────────────────────────── */}
      <Section title="Employment Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Department *" error={errors.department?.message}>
            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <select {...field} className={SELECT_CLASS} aria-invalid={!!errors.department}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
            />
          </Field>
          <Field label="Job Title *" error={errors.jobTitle?.message}>
            <Input {...register('jobTitle')} aria-invalid={!!errors.jobTitle} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Qualification / Specialty">
            <Input {...register('qualification')} />
          </Field>
          <Field label="Date of Employment *" error={errors.dateOfEmployment?.message}>
            <Input type="date" {...register('dateOfEmployment')} aria-invalid={!!errors.dateOfEmployment} />
          </Field>
        </div>

        <Field label="Staff ID (leave blank to auto-generate)">
          <Input {...register('employeeId')} className="font-mono" />
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
              aria-invalid={!!errors.loginEmail}
            />
          </Field>
          <Field label="System Role *" error={errors.systemRole?.message}>
            <Controller
              name="systemRole"
              control={control}
              render={({ field }) => (
                <select {...field} className={SELECT_CLASS} aria-invalid={!!errors.systemRole}>
                  <option value="">Select role</option>
                  {HOSPITAL_ROLES_FOR_STAFF.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              )}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Password *" error={errors.password?.message}>
            <div className="relative">
              <Input
                type={showPwd ? 'text' : 'password'}
                {...register('password')}
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
