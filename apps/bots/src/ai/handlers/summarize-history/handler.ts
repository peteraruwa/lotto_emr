import type { BotEvent, MedplumClient } from '@medplum/core';
import { createGeminiClient } from '../../gemini-client/client';
import {
  deidentifyPatient,
  deidentifyConditions,
  deidentifyMedications,
  deidentifyObservations,
} from '../../deidentify/deidentify';
import {
  SUMMARIZE_HISTORY_SYSTEM_PROMPT,
  buildSummarizeHistoryPrompt,
} from '../../prompts/summarize-history.prompt';
import {
  getActiveConditions,
  getActiveMedications,
  getRecentObservations,
  getPatientAllergies,
  getAllergySubstanceName,
} from '../../../shared/fhir/fhir-utils';

interface SummarizeHistoryInput {
  patientId: string;
  reasonForReferral: string;
  relevantHistory?: string;
}

/**
 * AI Bot: Patient History Summarizer for Referral Letters
 *
 * Generates a de-identified clinical summary suitable for a referral letter.
 * The clinician adds the patient's name and their own signature before sending.
 */
export async function handler(
  medplum: MedplumClient,
  event: BotEvent
): Promise<{ summary: string }> {
  const input = event.input as SummarizeHistoryInput;
  const { patientId, reasonForReferral, relevantHistory } = input;

  if (!patientId || !reasonForReferral) {
    throw new Error('patientId and reasonForReferral are required');
  }

  const [patient, conditions, medications, observations, allergies] = await Promise.all([
    medplum.readResource('Patient', patientId),
    getActiveConditions(medplum, patientId),
    getActiveMedications(medplum, patientId),
    getRecentObservations(medplum, patientId, 10),
    getPatientAllergies(medplum, patientId),
  ]);

  const patientDescriptor = deidentifyPatient(patient as any);

  const prompt = buildSummarizeHistoryPrompt({
    patientDescriptor,
    reasonForReferral,
    activeConditions: deidentifyConditions(conditions as any),
    activeMedications: deidentifyMedications(medications as any),
    recentResults: deidentifyObservations(observations as any),
    allergyList: (allergies as any[]).map(getAllergySubstanceName),
    relevantHistory,
  });

  const gemini = createGeminiClient();
  const summary = await gemini.generateContent(prompt, {
    systemInstruction: SUMMARIZE_HISTORY_SYSTEM_PROMPT,
    temperature: 0.2,
    maxOutputTokens: 1024,
  });

  return { summary };
}
