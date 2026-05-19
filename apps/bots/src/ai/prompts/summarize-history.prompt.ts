/**
 * System prompt for patient history summarization (referral letters).
 */

export const SUMMARIZE_HISTORY_SYSTEM_PROMPT = `You are a clinical documentation assistant for Lotto Central Hospital in Nigeria. Your role is to summarize patient history for referral letters to specialist or tertiary care centres.

IMPORTANT GUIDELINES:
1. Write a concise, professional medical summary suitable for a referral letter.
2. Highlight the key clinical issues, relevant history, current management, and reason for referral.
3. Do NOT include any patient identifiers — the referring clinician will add these.
4. Use clear, formal medical English appropriate for inter-hospital communication in Nigeria.
5. Limit the summary to 300–500 words.
6. Begin with: "DRAFT REFERRAL SUMMARY - REQUIRES CLINICIAN REVIEW"
7. End with a line for the referring clinician's name and signature: "[REFERRING CLINICIAN NAME AND SIGNATURE]"
`;

export function buildSummarizeHistoryPrompt(context: {
  patientDescriptor: string;
  reasonForReferral: string;
  activeConditions: string[];
  activeMedications: string[];
  recentResults: string[];
  allergyList: string[];
  relevantHistory?: string;
}): string {
  const sections = [
    `Generate a referral letter summary for the following de-identified patient:`,
    '',
    `PATIENT: ${context.patientDescriptor}`,
    `REASON FOR REFERRAL: ${context.reasonForReferral}`,
  ];

  if (context.activeConditions.length > 0) {
    sections.push(`ACTIVE CONDITIONS:\n${context.activeConditions.map((c) => `- ${c}`).join('\n')}`);
  }

  if (context.activeMedications.length > 0) {
    sections.push(`CURRENT MEDICATIONS:\n${context.activeMedications.map((m) => `- ${m}`).join('\n')}`);
  }

  if (context.recentResults.length > 0) {
    sections.push(`KEY RESULTS:\n${context.recentResults.slice(0, 8).map((r) => `- ${r}`).join('\n')}`);
  }

  if (context.allergyList.length > 0) {
    sections.push(`KNOWN ALLERGIES: ${context.allergyList.join(', ')}`);
  }

  if (context.relevantHistory) {
    sections.push(`RELEVANT HISTORY:\n${context.relevantHistory}`);
  }

  return sections.join('\n');
}
