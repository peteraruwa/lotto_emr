# Medplum Access Policies

This directory contains Medplum `AccessPolicy` resources for each role in the Lotto Central Hospital EMR. Access policies are the primary mechanism for enforcing role-based access control at the FHIR server level.

## How Medplum Access Policies Work

Medplum evaluates access policies server-side on every API request. A policy is attached to a `ProjectMembership` — the join record between a `User` and a `Project`. When a user makes a request, Medplum:

1. Resolves the user's `ProjectMembership`.
2. Loads the associated `AccessPolicy`.
3. Checks whether the requested resource type is listed in the policy.
4. Enforces `readonly: true` by rejecting write operations (`POST`, `PUT`, `PATCH`, `DELETE`) on restricted resource types.
5. Strips `hiddenFields` from responses before returning to the client.

Policies are **additive per resource type** — if a resource type is not listed, access is denied entirely (deny-by-default).

## Applying Policies

### Via Medplum Admin UI

1. Navigate to **Project → Members**.
2. Click the membership row for the user.
3. In the **Access Policy** field, type the policy name or reference (e.g. `AccessPolicy/doctor`).
4. Save.

### Via Medplum CLI

```bash
medplum login
medplum patch ProjectMembership/<membership-id> \
  '{"accessPolicy": {"reference": "AccessPolicy/doctor"}}'
```

### Via Seed Script

The seed script at `medplum/seed/seed.ts` automatically assigns policies when creating test users.

For dev/testing, use `medplum/seed/dev-seed.ts` instead — it seeds all role navigation test accounts (password: `1234`) without touching the main QA dataset.

### Via Bot (programmatic)

```typescript
import { MedplumClient } from '@medplum/core';

async function assignPolicy(medplum: MedplumClient, membershipId: string, policyId: string) {
  await medplum.patchResource('ProjectMembership', membershipId, [
    { op: 'replace', path: '/accessPolicy', value: { reference: `AccessPolicy/${policyId}` } },
  ]);
}
```

## Role Summary

| Role | File | Write Resources | Restricted From |
|------|------|-----------------|-----------------|
| **Doctor** | `doctor.json` | Full clinical chart | Billing, Coverage, Claim |
| **Nurse** | `nurse.json` | Observations, Encounters, CarePlan, MedicationAdministration | MedicationRequest (write), DiagnosticReport |
| **Pharmacist** | `pharmacist.json` | MedicationDispense, Medication | Clinical chart, full patient demographics |
| **Lab Tech** | `lab.json` | Observations, DiagnosticReport, Specimen | Prescriptions, encounters, notes |
| **Radiologist** | `radiologist.json` | ImagingStudy, DiagnosticReport | Prescriptions, full demographics |
| **Admin** | `admin.json` | Patient registration, Appointments, Billing | All clinical resources |

## Hidden Fields

Some policies use `hiddenFields` to redact sensitive demographic data from responses when clinical staff do not require it:

- **Pharmacist**: `address`, `contact`, `communication` hidden on Patient
- **Lab Technician**: `address`, `telecom`, `contact` hidden on Patient
- **Radiologist**: `address`, `telecom`, `contact` hidden on Patient

This ensures minimum necessary access in line with data protection principles.

## Uploading Policies to Medplum

To upload all policies to a running Medplum instance:

```bash
for file in medplum/access-policies/*.json; do
  medplum upload "$file"
done
```

Or using the Medplum REST API directly:

```bash
curl -X POST "$MEDPLUM_BASE_URL/fhir/R4/AccessPolicy" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @medplum/access-policies/doctor.json
```

## Security Notes

- Access policies are **enforced server-side**. Frontend RBAC (the `RequireRole` component) is a UX convenience only — never rely on it for security.
- Test your policies with `medplum get Patient?_count=1` logged in as each role to confirm correct filtering.
- Never grant `admin` role users access to clinical resources — the separation is intentional.
