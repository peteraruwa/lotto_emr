import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    action?: string;
    text?: string;
    context?: Record<string, unknown>;
  } | null;

  const { action, text, context } = body ?? {};

  if (!action || !text) {
    return NextResponse.json({ error: 'action and text required' }, { status: 400 });
  }

  try {
    if (action === 'icd-search') {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `You are a clinical coding assistant specializing in ICD-10 codes for a Nigerian hospital.
Given a diagnosis or clinical description, return a JSON array of relevant ICD-10 codes.
Respond ONLY with valid JSON — no prose, no markdown fences.
Format: [{"code": "I10", "description": "Essential (primary) hypertension"}, ...]
Return 3-7 of the most relevant codes. Prioritize codes commonly used in Nigerian clinical practice.`,
        messages: [
          {
            role: 'user',
            content: `Find ICD-10 codes for: ${text}`,
          },
        ],
      });

      const responseText =
        message.content[0].type === 'text' ? message.content[0].text : '';

      let codes: Array<{ code: string; description: string }> = [];
      try {
        // Strip any accidental markdown fences
        const cleaned = responseText.replace(/```[a-z]*\n?/g, '').trim();
        codes = JSON.parse(cleaned);
      } catch {
        codes = [];
      }

      return NextResponse.json({ codes });
    }

    if (action === 'expand-section') {
      const sectionName = (context?.section as string) ?? 'clinical section';

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `You are an experienced Nigerian hospital physician assistant helping doctors write clinical notes.
Expand the provided clinical text into a well-structured, professional clinical note section.
Use standard medical terminology appropriate for a Nigerian hospital setting.
Keep the expansion clinically accurate, concise, and in the third person.
Do NOT add fabricated clinical details — only expand and structure what is provided.
Respond with only the expanded text, no additional commentary.`,
        messages: [
          {
            role: 'user',
            content: `Section: ${sectionName}\n\nExpand this clinical text:\n${text}`,
          },
        ],
      });

      const expanded =
        message.content[0].type === 'text' ? message.content[0].text : text;

      return NextResponse.json({ expanded });
    }

    if (action === 'suggest-plan') {
      const age = (context?.age as number | undefined) ?? null;
      const gender = (context?.gender as string | undefined) ?? 'unknown';
      const conditions = (context?.conditions as string[] | undefined) ?? [];
      const medications = (context?.medications as string[] | undefined) ?? [];

      const patientContext = [
        age !== null ? `Age: ${age}` : null,
        `Gender: ${gender}`,
        conditions.length > 0 ? `Active conditions: ${conditions.join(', ')}` : null,
        medications.length > 0 ? `Current medications: ${medications.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: `You are a senior clinician at a Nigerian tertiary hospital creating management plans.
Generate a comprehensive, structured management plan appropriate for a Nigerian hospital setting.
Consider local drug availability, national treatment guidelines, and resource constraints.
Structure the plan with clear headings: Investigations, Medications, Non-pharmacological measures, Follow-up, Patient education.
Use generic drug names. Include specific dosages where appropriate.
Be practical and evidence-based. Respond with the plan text only.`,
        messages: [
          {
            role: 'user',
            content: `Patient context:\n${patientContext}\n\nDiagnosis/Assessment:\n${text}\n\nGenerate a management plan.`,
          },
        ],
      });

      const plan =
        message.content[0].type === 'text' ? message.content[0].text : '';

      return NextResponse.json({ plan });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
