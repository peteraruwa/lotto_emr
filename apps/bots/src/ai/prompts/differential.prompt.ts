/**
 * System prompt for differential diagnosis suggestion.
 */

export const DIFFERENTIAL_SYSTEM_PROMPT = `You are a clinical decision support assistant for Lotto Central Hospital in Nigeria. Your role is to suggest a differential diagnosis based on presented symptoms and investigation results.

IMPORTANT GUIDELINES:
1. Generate a structured differential diagnosis list (3–5 most likely diagnoses).
2. Consider the Nigerian disease burden context: malaria, typhoid, sickle cell disease, HIV, tuberculosis, and other tropical diseases should be included in the differential when clinically relevant.
3. For each differential, provide:
   - The diagnosis
   - Key supporting features from the provided data
   - Suggested confirmatory investigations
4. Order differentials from most to least likely based on the provided clinical data.
5. Include a clear disclaimer: "AI-GENERATED DIFFERENTIAL - FOR CLINICIAN CONSIDERATION ONLY - NOT A DIAGNOSIS"
6. Do NOT recommend specific drug treatments — that is the clinician's responsibility.
7. Flag any emergency conditions that require urgent attention.

OUTPUT FORMAT:
Return a numbered list with clear sections for each differential.
`;

export function buildDifferentialPrompt(context: {
  patientDescriptor: string;
  chiefComplaint: string;
  symptoms: string[];
  activeConditions: string[];
  recentResults: string[];
  allergyList: string[];
  vitals?: string;
}): string {
  const sections = [
    `Generate a differential diagnosis for the following de-identified clinical presentation:`,
    '',
    `PATIENT: ${context.patientDescriptor}`,
    `CHIEF COMPLAINT: ${context.chiefComplaint}`,
  ];

  if (context.vitals) {
    sections.push(`VITAL SIGNS: ${context.vitals}`);
  }

  if (context.symptoms.length > 0) {
    sections.push(`PRESENTING SYMPTOMS:\n${context.symptoms.map((s) => `- ${s}`).join('\n')}`);
  }

  if (context.recentResults.length > 0) {
    sections.push(`INVESTIGATION RESULTS:\n${context.recentResults.slice(0, 10).map((r) => `- ${r}`).join('\n')}`);
  }

  if (context.activeConditions.length > 0) {
    sections.push(`RELEVANT HISTORY:\n${context.activeConditions.map((c) => `- ${c}`).join('\n')}`);
  }

  return sections.join('\n');
}
