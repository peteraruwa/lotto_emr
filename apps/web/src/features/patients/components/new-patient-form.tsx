'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, CardContent, Input, Label } from '@lotto-emr/ui';
import { newPatientSchema, type NewPatientFormData } from '../schemas/patient.schema';
import { useCreatePatient } from '../api/use-create-patient';

/**
 * New patient registration form.
 * On successful submission, redirects to the new patient's chart page.
 */
export function NewPatientForm() {
  const router = useRouter();
  const { mutateAsync: createPatient, isPending } = useCreatePatient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPatientFormData>({
    resolver: zodResolver(newPatientSchema),
    defaultValues: {
      gender: 'unknown',
    },
  });

  async function onSubmit(data: NewPatientFormData) {
    try {
      const patient = await createPatient(data);
      router.push(`/patients/${patient.id}`);
    } catch {
      // Error handled by the mutation's error state if needed
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Demographics */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-sm text-gray-900">Demographics</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" {...register('firstName')} placeholder="Emeka" />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" {...register('lastName')} placeholder="Okonkwo" />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
              {errors.dateOfBirth && (
                <p className="text-xs text-destructive">{errors.dateOfBirth.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="gender">Gender *</Label>
              <select
                id="gender"
                {...register('gender')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="unknown">Prefer not to say</option>
              </select>
              {errors.gender && (
                <p className="text-xs text-destructive">{errors.gender.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <select
                id="bloodGroup"
                {...register('bloodGroup')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Unknown</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="genotypeCode">Genotype</Label>
              <select
                id="genotypeCode"
                {...register('genotypeCode')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Unknown</option>
                {['AA', 'AS', 'SS', 'AC', 'SC'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-sm text-gray-900">Contact Information</h3>

          <div className="space-y-1">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input id="phone" {...register('phone')} placeholder="08012345678" type="tel" />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" {...register('email')} placeholder="patient@email.com" type="email" />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="address">Street Address</Label>
            <Input id="address" {...register('address')} placeholder="12 Adeola Odeku Street" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} placeholder="Lagos" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="state">State</Label>
              <select
                id="state"
                {...register('state')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Select state</option>
                {[
                  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
                  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
                  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
                  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
                  'Yobe','Zamfara',
                ].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next of Kin */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-sm text-gray-900">Next of Kin</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="nextOfKinName">Full Name</Label>
              <Input id="nextOfKinName" {...register('nextOfKinName')} placeholder="Ngozi Okonkwo" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nextOfKinRelationship">Relationship</Label>
              <select
                id="nextOfKinRelationship"
                {...register('nextOfKinRelationship')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Select relationship</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="child">Child</option>
                <option value="sibling">Sibling</option>
                <option value="friend">Friend</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="nextOfKinPhone">Phone Number</Label>
            <Input id="nextOfKinPhone" {...register('nextOfKinPhone')} placeholder="08098765432" type="tel" />
            {errors.nextOfKinPhone && (
              <p className="text-xs text-destructive">{errors.nextOfKinPhone.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insurance */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-sm text-gray-900">Insurance (Optional)</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="insuranceProvider">Insurance Provider</Label>
              <Input id="insuranceProvider" {...register('insuranceProvider')} placeholder="NHIS / Hygeia / etc." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="insuranceNumber">Policy Number</Label>
              <Input id="insuranceNumber" {...register('insuranceNumber')} placeholder="NHIS-12345678" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Registering...' : 'Register Patient'}
        </Button>
      </div>
    </form>
  );
}
