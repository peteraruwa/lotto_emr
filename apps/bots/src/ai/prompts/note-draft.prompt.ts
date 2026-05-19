/**
 * System prompt for clinical note drafting.
 *
 * Gemini generates a draft based on de-identified clinical context.
 * The draft must be reviewed and edited by the clinician before saving.
 */

export const NOTE_DRAFT_SYSTEM_PROMPT = `You are a clinical documentation assistant for Lotto Central Hospital in Nigeria. Your role is to help clinicians draft initial clinical notes based on patient encounter data.

IMPORTANT GUIDELINES:
1. Generate a well-structured draft clinical note appropriate for Nigerian healthcare standards.
2. Use clear, professional medical terminology.
3. Where clinical information is uncertain or missing, use placeholder text in brackets: [PROVIDER TO COMPLETE].
4. Do NOT invent clinical findings, diagnoses, or medications that are not mentioned in the provided context.
5. Always include a clear disclaimer at the top: "DRAFT - REQUIRES CLINICIAN REVIEW AND SIGNATURE BEFORE SAVING"
6. The note is for a Nigerian hospital context — reference local disease patterns where appropriate (malaria, sickle cell, typhoid, etc.) only if they appear in the provided data.
7. Use metric units (kg, cm, mmHg, °C, mmol/L, g/dL) throughout.

OUTPUT FORMAT:
Return only the note text — no JSON, no markdown formatting beyond paragraph breaks.
Begin with "DRAFT - REQUIRES CLINICIAN REVIEW AND SIGNATURE BEFORE SAVING"
`;

export function buildNoteDraftPrompt(context: {
  noteType: string;
  patientDescriptor: string;
  chiefComplaint?: string;
  activeConditions: string[];
  activeMedications: string[];
  recentResults: string[];
  allergyList: string[];
}): string {
  const sections = [
    `Generate a ${context.noteType} clinical note for the following de-identified patient context:`,
    '',
    `PATIENT: ${context.patientDescriptor}`,
  ];

  if (context.chiefComplaint) {
    sections.push(`CHIEF COMPLAINT: ${context.chiefComplaint}`);
  }

  if (context.activeConditions.length > 0) {
    sections.push(`ACTIVE CONDITIONS:\n${context.activeConditions.map((c) => `- ${c}`).join('\n')}`);
  }

  if (context.activeMedications.length > 0) {
    sections.push(`CURRENT MEDICATIONS:\n${context.activeMedications.map((m) => `- ${m}`).join('\n')}`);
  }

  if (context.recentResults.length > 0) {
    sections.push(`RECENT RESULTS:\n${context.recentResults.slice(0, 10).map((r) => `- ${r}`).join('\n')}`);
  }

  if (context.allergyList.length > 0) {
    sections.push(`ALLERGIES:\n${context.allergyList.map((a) => `- ${a}`).join('\n')}`);
  }

  sections.push('', 'Please generate a structured draft note. Include clear [PROVIDER TO COMPLETE] placeholders for any sections requiring clinical judgment.');

  return sections.join('\n');
}
