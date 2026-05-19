import type { BotEvent, MedplumClient } from '@medplum/core';
import { createGeminiClient } from '../../gemini-client/client';
import {
  deidentifyPatient,
  deidentifyConditions,
  deidentifyMedications,
  deidentifyObservations,
} from '../../deidentify/deidentify';
import {
  NOTE_DRAFT_SYSTEM_PROMPT,
  buildNoteDraftPrompt,
} from '../../prompts/note-draft.prompt';
import {
  getActiveConditions,
  getActiveMedications,
  getRecentObservations,
  getPatientAllergies,
  getAllergySubstanceName,
} from '../../../shared/fhir/fhir-utils';

interface NoteDraftInput {
  patientId: string;
  encounterId?: string;
  noteType?: string;
  chiefComplaint?: string;
}

/**
 * AI Bot: Clinical Note Draft Generator
 *
 * 1. Fetches patient context from Medplum.
 * 2. De-identifies all PHI using the deidentify module.
 * 3. Sends de-identified context to Gemini for note generation.
 * 4. Returns the draft text — NEVER stores it as a signed document.
 *
 * The clinician must explicitly review, edit, and sign the note
 * before it is saved as a DocumentReference.
 */
export async function handler(
  medplum: MedplumClient,
  event: BotEvent
): Promise<{ draft: string; disclaimer: string }> {
  const input = event.input as NoteDraftInput;
  const { patientId, noteType = 'SOAP', chiefComplaint, encounterId } = input;

  if (!patientId) {
    throw new Error('patientId is required');
  }

  // Fetch clinical context in parallel
  const [patient, conditions, medications, observations, allergies] = await Promise.all([
    medplum.readResource('Patient', patientId),
    getActiveConditions(medplum, patientId),
    getActiveMedications(medplum, patientId),
    getRecentObservations(medplum, patientId, 15),
    getPatientAllergies(medplum, patientId),
  ]);

  // De-identify all data before sending to Gemini
  const patientDescriptor = deidentifyPatient(patient as any);
  const deidentifiedConditions = deidentifyConditions(conditions as any);
  const deidentifiedMedications = deidentifyMedications(medications as any);
  const deidentifiedResults = deidentifyObservations(observations as any);
  const allergyList = (allergies as any[]).map(getAllergySubstanceName);

  const prompt = buildNoteDraftPrompt({
    noteType,
    patientDescriptor,
    chiefComplaint,
    activeConditions: deidentifiedConditions,
    activeMedications: deidentifiedMedications,
    recentResults: deidentifiedResults,
    allergyList,
  });

  const gemini = createGeminiClient();
  const draft = await gemini.generateContent(prompt, {
    systemInstruction: NOTE_DRAFT_SYSTEM_PROMPT,
    temperature: 0.3,
    maxOutputTokens: 2048,
  });

  return {
    draft,
    disclaimer: 'IMPORTANT: This is an AI-generated draft. It must be reviewed, edited, and signed by a qualified clinician before being filed. Do not rely on this draft without clinical verification.',
  };
}
