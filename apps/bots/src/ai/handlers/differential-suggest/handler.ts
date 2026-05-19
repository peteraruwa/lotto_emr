import type { BotEvent, MedplumClient } from '@medplum/core';
import { createGeminiClient } from '../../gemini-client/client';
import {
  deidentifyPatient,
  deidentifyConditions,
  deidentifyObservations,
} from '../../deidentify/deidentify';
import {
  DIFFERENTIAL_SYSTEM_PROMPT,
  buildDifferentialPrompt,
} from '../../prompts/differential.prompt';
import {
  getActiveConditions,
  getRecentObservations,
} from '../../../shared/fhir/fhir-utils';

interface DifferentialInput {
  patientId: string;
  chiefComplaint: string;
  symptoms: string[];
  vitals?: string;
}

/**
 * AI Bot: Differential Diagnosis Suggester
 *
 * Suggests 3–5 differential diagnoses based on de-identified clinical data.
 * Output is advisory only — the clinician makes the final diagnosis.
 *
 * Nigerian disease context (malaria, typhoid, etc.) is factored in by
 * the system prompt.
 */
export async function handler(
  medplum: MedplumClient,
  event: BotEvent
): Promise<{ differentials: string; disclaimer: string }> {
  const input = event.input as DifferentialInput;
  const { patientId, chiefComplaint, symptoms, vitals } = input;

  if (!patientId || !chiefComplaint) {
    throw new Error('patientId and chiefComplaint are required');
  }

  const [patient, conditions, observations] = await Promise.all([
    medplum.readResource('Patient', patientId),
    getActiveConditions(medplum, patientId),
    getRecentObservations(medplum, patientId, 20),
  ]);

  const prompt = buildDifferentialPrompt({
    patientDescriptor: deidentifyPatient(patient as any),
    chiefComplaint,
    symptoms: symptoms ?? [],
    activeConditions: deidentifyConditions(conditions as any),
    recentResults: deidentifyObservations(observations as any),
    allergyList: [],
    vitals,
  });

  const gemini = createGeminiClient();
  const differentials = await gemini.generateContent(prompt, {
    systemInstruction: DIFFERENTIAL_SYSTEM_PROMPT,
    temperature: 0.4,
    maxOutputTokens: 1500,
  });

  return {
    differentials,
    disclaimer:
      'AI-GENERATED DIFFERENTIAL DIAGNOSIS — FOR CLINICIAN CONSIDERATION ONLY. This is not a clinical diagnosis. The responsible clinician must evaluate and determine the final diagnosis.',
  };
}
