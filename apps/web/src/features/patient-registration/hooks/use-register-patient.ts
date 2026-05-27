'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMedplum } from '@medplum/react';
import type {
  Patient, RelatedPerson, Coverage, AllergyIntolerance,
  Condition, Flag, Consent,
} from '@medplum/fhirtypes';
import type { RegistrationFormData } from '../schemas/registration.schema';

// ── FHIR system constants ────────────────────────────────────────────────────
const MRN_SYSTEM     = 'https://lotto-hospital.local/fhir/identifier/mrn';
const NIN_SYSTEM     = 'https://lotto-hospital.local/fhir/identifier/nin';
const INS_SYSTEM     = 'https://lotto-hospital.local/fhir/identifier/insurance';
const EXT_BLOOD      = 'https://lotto-hospital.local/fhir/StructureDefinition/blood-group';
const EXT_GENO       = 'https://lotto-hospital.local/fhir/StructureDefinition/genotype';
const EXT_TRIBE      = 'https://lotto-hospital.local/fhir/StructureDefinition/tribe';
const EXT_RELIGION   = 'https://lotto-hospital.local/fhir/StructureDefinition/religion';
const EXT_BT_CONSENT = 'https://lotto-hospital.local/fhir/StructureDefinition/blood-transfusion-consent';

function generateMRN(): string {
  const year = new Date().getFullYear();
  const seq  = String(Math.floor(100000 + Math.random() * 900000));
  return `LCH-${year}-${seq}`;
}

function mapBTConsentCode(value: RegistrationFormData['bloodTransfusionConsent']): {
  provisionType: 'permit' | 'deny';
  display: string;
} {
  if (value === 'refuses') return { provisionType: 'deny',   display: 'Patient refuses blood transfusion' };
  if (value === 'consents') return { provisionType: 'permit', display: 'Patient consents to blood transfusion' };
  if (value === 'conditional') return { provisionType: 'permit', display: 'Conditional consent — review conditions before transfusing' };
  return { provisionType: 'permit', display: 'Decision deferred — obtain informed consent before transfusion' };
}

function mapNokRelCode(rel: string): string {
  const map: Record<string, string> = {
    spouse: 'SPS', parent: 'PAR', child: 'CHILD',
    sibling: 'SIB', guardian: 'GUARD', friend: 'FRND', other: 'O',
  };
  return map[rel] ?? 'O';
}

export interface RegistrationResult {
  patient:      Patient;
  patientId:    string;
  mrn:          string;
  resourcesCreated: string[];
}

export function useRegisterPatient() {
  const medplum     = useMedplum();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegistrationFormData): Promise<RegistrationResult> => {
      const mrn     = generateMRN();
      const created: string[] = [];

      // ── 1. Patient resource ────────────────────────────────────────────
      const patientResource: Patient = {
        resourceType: 'Patient',
        active: true,
        name: [{
          use: 'official',
          given: [data.firstName, data.middleName].filter(Boolean),
          family: data.lastName,
        }],
        gender: data.gender,
        birthDate: data.dateOfBirth,
        telecom: [
          { system: 'phone', value: data.phone, use: 'mobile' },
          ...(data.altPhone ? [{ system: 'phone' as const, value: data.altPhone, use: 'home' as const }] : []),
          ...(data.email    ? [{ system: 'email' as const, value: data.email,    use: 'home' as const }] : []),
        ],
        address: (data.addressLine1 || data.city || data.state) ? [{
          use: 'home',
          line: [data.addressLine1, data.addressLine2].filter(Boolean),
          city:    data.city    || undefined,
          state:   data.state   || undefined,
          country: 'NG',
        }] : undefined,
        identifier: [
          {
            use: 'official',
            system: MRN_SYSTEM,
            value: mrn,
            type: {
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR', display: 'Medical Record Number' }],
              text: 'MRN',
            },
          },
          ...(data.nin ? [{
            system: NIN_SYSTEM,
            value: data.nin,
            type: {
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'NI', display: 'National Unique Individual Identifier' }],
              text: 'NIN',
            },
          }] : []),
          ...(data.hmoPolicyNumber ? [{
            system: INS_SYSTEM,
            value: data.hmoPolicyNumber,
            type: {
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MB' }],
              text: data.hmoProvider || data.paymentMode.toUpperCase(),
            },
          }] : []),
          ...(data.nhisNumber ? [{
            system: 'https://lotto-hospital.local/fhir/identifier/nhis',
            value: data.nhisNumber,
            type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MB' }], text: 'NHIS' },
          }] : []),
        ],
        extension: [
          ...(data.bloodGroup ? [{ url: EXT_BLOOD,  valueString: data.bloodGroup }] : []),
          ...(data.genotype   ? [{ url: EXT_GENO,   valueString: data.genotype }]   : []),
          ...(data.tribe      ? [{ url: EXT_TRIBE,  valueString: data.tribe }]      : []),
          ...(data.religion   ? [{ url: EXT_RELIGION, valueString: data.religion }] : []),
          // Blood transfusion consent as a lightweight extension for quick read
          {
            url: EXT_BT_CONSENT,
            valueString: data.bloodTransfusionConsent,
          },
        ],
      };

      const patient = await medplum.createResource(patientResource);
      const patientId = patient.id!;
      created.push('Patient');

      // ── 2. RelatedPerson (Next of Kin) ─────────────────────────────────
      if (data.nokFirstName || data.nokLastName) {
        const nok: RelatedPerson = {
          resourceType: 'RelatedPerson',
          active: true,
          patient: { reference: `Patient/${patientId}` },
          relationship: data.nokRelationship ? [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
              code: mapNokRelCode(data.nokRelationship),
              display: data.nokRelationship.charAt(0).toUpperCase() + data.nokRelationship.slice(1),
            }],
          }] : undefined,
          name: [{
            use: 'official',
            given: [data.nokFirstName].filter(Boolean),
            family: data.nokLastName || undefined,
          }],
          telecom: [
            ...(data.nokPhone ? [{ system: 'phone' as const, value: data.nokPhone }] : []),
            ...(data.nokEmail ? [{ system: 'email' as const, value: data.nokEmail }] : []),
          ],
          address: data.nokAddress ? [{ text: data.nokAddress }] : undefined,
        };
        await medplum.createResource(nok);
        created.push('RelatedPerson');
      }

      // ── 3. Coverage (HMO / NHIS) ───────────────────────────────────────
      if (data.paymentMode !== 'cash' && (data.hmoProvider || data.nhisNumber || data.hmoPolicyNumber)) {
        const coverage: Coverage = {
          resourceType: 'Coverage',
          status: 'active',
          beneficiary: { reference: `Patient/${patientId}` },
          subscriber: { reference: `Patient/${patientId}` },
          subscriberId: data.hmoPolicyNumber || data.nhisNumber || undefined,
          payor: [{ display: data.hmoProvider || (data.paymentMode === 'nhis' ? 'NHIS' : data.paymentMode.toUpperCase()) }],
          class: data.hmoGroup ? [{ type: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/coverage-class', code: 'group' }] }, value: data.hmoGroup }] : undefined,
          type: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
              code: data.paymentMode === 'nhis' ? 'SUBSIDIZ' : 'HMO',
              display: data.hmoProvider || data.paymentMode.toUpperCase(),
            }],
          },
        };
        await medplum.createResource(coverage);
        created.push('Coverage');
      }

      // ── 4. AllergyIntolerance resources ───────────────────────────────
      for (const allergy of data.allergies.filter((a) => a.substance)) {
        const ai: AllergyIntolerance = {
          resourceType: 'AllergyIntolerance',
          clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical', code: 'active', display: 'Active' }] },
          verificationStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification', code: 'unconfirmed' }] },
          patient: { reference: `Patient/${patientId}` },
          code: { text: allergy.substance },
          reaction: allergy.reaction ? [{
            manifestation: [{ text: allergy.reaction }],
            ...(allergy.severity ? { severity: allergy.severity as 'mild' | 'moderate' | 'severe' } : {}),
          }] : undefined,
        };
        await medplum.createResource(ai);
      }
      if (data.allergies.filter((a) => a.substance).length > 0) created.push(`AllergyIntolerance ×${data.allergies.length}`);

      // ── 5. Condition resources ────────────────────────────────────────
      for (const cond of data.chronicConditions.filter((c) => c.name)) {
        const condition: Condition = {
          resourceType: 'Condition',
          clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active', display: 'Active' }] },
          subject: { reference: `Patient/${patientId}` },
          code: { text: cond.name },
          ...(cond.since ? { onsetString: cond.since } : {}),
        };
        await medplum.createResource(condition);
      }
      if (data.chronicConditions.filter((c) => c.name).length > 0) created.push(`Condition ×${data.chronicConditions.length}`);

      // ── 6. Flag resources (risk flags) ────────────────────────────────
      const flagDefs: Array<{ key: keyof typeof data.riskFlags; label: string; snomedCode: string }> = [
        { key: 'diabetic',          label: 'Diabetes Mellitus',           snomedCode: '73211009'  },
        { key: 'hypertensive',      label: 'Hypertension',                snomedCode: '38341003'  },
        { key: 'asthmatic',         label: 'Asthma',                      snomedCode: '195967001' },
        { key: 'sickleCellDisease', label: 'Sickle Cell Disease',         snomedCode: '417357006' },
        { key: 'pregnant',          label: 'Pregnancy',                   snomedCode: '77386006'  },
        { key: 'immunocompromised', label: 'Immunocompromised',           snomedCode: '370388006' },
        { key: 'epileptic',         label: 'Epilepsy',                    snomedCode: '84757009'  },
        { key: 'hivPositive',       label: 'HIV Positive',                snomedCode: '86406008'  },
      ];

      let flagCount = 0;
      for (const def of flagDefs) {
        if (data.riskFlags[def.key]) {
          const flag: Flag = {
            resourceType: 'Flag',
            status: 'active',
            subject: { reference: `Patient/${patientId}` },
            code: {
              text: def.label,
              coding: [{ system: 'http://snomed.info/sct', code: def.snomedCode, display: def.label }],
            },
            category: [{
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/flag-category',
                code: 'clinical',
                display: 'Clinical',
              }],
            }],
          };
          await medplum.createResource(flag);
          flagCount++;
        }
      }
      if (flagCount > 0) created.push(`Flag ×${flagCount}`);

      // ── 7. Consent — Blood Transfusion ────────────────────────────────
      const btMap = mapBTConsentCode(data.bloodTransfusionConsent);
      const btConsent: Consent = {
        resourceType: 'Consent',
        status: 'active',
        patient: { reference: `Patient/${patientId}` },
        scope: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'treatment', display: 'Treatment' }] },
        category: [{
          coding: [{ system: 'http://loinc.org', code: '59284-0', display: 'Consent Document' }],
          text: 'Blood Transfusion Consent',
        }],
        policyRule: {
          coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'INFA' }],
        },
        provision: {
          type: btMap.provisionType,
          ...(data.bloodTransfusionConditions ? {
            extension: [{
              url: 'https://lotto-hospital.local/fhir/StructureDefinition/bt-conditions',
              valueString: data.bloodTransfusionConditions,
            }],
          } : {}),
        },
      } as Consent;
      // Store consent details in an extension since FHIR Consent note type varies by medplum version
      (btConsent as any).note = [{ text: `Blood transfusion: ${btMap.display}${data.bloodTransfusionConditions ? ` — Conditions: ${data.bloodTransfusionConditions}` : ''}` }];
      await medplum.createResource(btConsent);
      created.push('Consent (BloodTransfusion)');

      // ── 8. Consent — NDPR Data Processing ────────────────────────────
      const ndprConsent: Consent = {
        resourceType: 'Consent',
        status: 'active',
        patient: { reference: `Patient/${patientId}` },
        dateTime: new Date().toISOString(),
        scope: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy', display: 'Privacy Consent' }] },
        category: [{
          coding: [{ system: 'http://loinc.org', code: '59284-0', display: 'Consent Document' }],
          text: 'NDPR Data Processing Consent',
        }],
        policyRule: {
          coding: [{
            system: 'https://lotto-hospital.local/fhir/CodeSystem/consent-policy',
            code: 'NDPR-2019',
            display: 'Nigeria Data Protection Regulation 2019',
          }],
        },
        provision: {
          type: 'permit',
          ...(data.ndprMarketingConsent ? {} : {
            action: [{
              coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentaction', code: 'access' }],
            }],
          }),
        },
      };
      (ndprConsent as any).note = [{ text: `NDPR consent granted for clinical data processing. Marketing: ${data.ndprMarketingConsent ? 'yes' : 'no'}.` }];
      await medplum.createResource(ndprConsent);
      created.push('Consent (NDPR)');

      return { patient, patientId, mrn, resourcesCreated: created };
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
