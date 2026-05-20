import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EMR_API_KEY ?? '');

const flashModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
const proModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as {
    action?: string;
    text?: string;
    context?: Record<string, unknown>;
    examData?: Record<string, Record<string, string | string[]>>;
  } | null;

  const { action, text, context, examData } = body ?? {};

  if (!action) {
    return NextResponse.json({ error: 'action required' }, { status: 400 });
  }

  // convert-exam and suggest-alerts do not require text
  if (!text && action !== 'convert-exam' && action !== 'suggest-alerts') {
    return NextResponse.json({ error: 'action and text required' }, { status: 400 });
  }

  try {
    if (action === 'icd-search') {
      const result = await flashModel.generateContent({
        systemInstruction: `You are a clinical coding assistant specializing in ICD-10 codes for a Nigerian hospital.
Given a diagnosis or clinical description, return a JSON array of relevant ICD-10 codes.
Respond ONLY with valid JSON — no prose, no markdown fences.
Format: [{"code": "I10", "description": "Essential (primary) hypertension"}, ...]
Return 3-7 of the most relevant codes. Prioritize codes commonly used in Nigerian clinical practice.`,
        contents: [{ role: 'user', parts: [{ text: `Find ICD-10 codes for: ${text}` }] }],
      });

      const responseText = result.response.text();
      let codes: Array<{ code: string; description: string }> = [];
      try {
        const cleaned = responseText.replace(/```[a-z]*\n?/g, '').trim();
        codes = JSON.parse(cleaned);
      } catch {
        codes = [];
      }

      return NextResponse.json({ codes });
    }

    if (action === 'expand-section') {
      const sectionName = (context?.section as string) ?? 'clinical section';

      const result = await flashModel.generateContent({
        systemInstruction: `You are an experienced Nigerian hospital physician assistant helping doctors write clinical notes.
Expand the provided clinical text into a well-structured, professional clinical note section.
Use standard medical terminology appropriate for a Nigerian hospital setting.
Keep the expansion clinically accurate, concise, and in the third person.
Do NOT add fabricated clinical details — only expand and structure what is provided.
Respond with only the expanded text, no additional commentary.`,
        contents: [
          {
            role: 'user',
            parts: [{ text: `Section: ${sectionName}\n\nExpand this clinical text:\n${text}` }],
          },
        ],
      });

      const expanded = result.response.text() || text;
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

      const result = await proModel.generateContent({
        systemInstruction: `You are a senior clinician at a Nigerian tertiary hospital creating management plans.
Generate a comprehensive, structured management plan appropriate for a Nigerian hospital setting.
Consider local drug availability, national treatment guidelines, and resource constraints.
Structure the plan with clear headings: Investigations, Medications, Non-pharmacological measures, Follow-up, Patient education.
Use generic drug names. Include specific dosages where appropriate.
Be practical and evidence-based. Respond with the plan text only.`,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Patient context:\n${patientContext}\n\nDiagnosis/Assessment:\n${text}\n\nGenerate a management plan.`,
              },
            ],
          },
        ],
      });

      const plan = result.response.text();
      return NextResponse.json({ plan });
    }

    if (action === 'convert-exam') {
      if (!examData || typeof examData !== 'object') {
        return NextResponse.json({ error: 'examData required' }, { status: 400 });
      }

      // Convert structured exam data to readable text for the AI
      const lines: string[] = [];
      for (const [moduleId, categories] of Object.entries(examData)) {
        // Convert moduleId to a readable label (e.g. general_examination -> General Examination)
        const moduleLabel = moduleId
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        const findings: string[] = [];
        for (const [category, selection] of Object.entries(categories)) {
          if (Array.isArray(selection)) {
            findings.push(`${category}: ${selection.join(', ')}`);
          } else {
            findings.push(`${category}: ${selection}`);
          }
        }

        if (findings.length > 0) {
          lines.push(`${moduleLabel}:\n  ${findings.join('\n  ')}`);
        }
      }

      const examText = lines.join('\n\n');

      const result = await flashModel.generateContent({
        systemInstruction: `You are a clinical documentation assistant. Convert the structured examination findings into a professional clinical examination narrative in the third person. Use formal medical language. Be concise. Do not add findings not present in the input. Do not include diagnoses or interpretations.`,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Convert the following structured examination findings into a clinical narrative:\n\n${examText}`,
              },
            ],
          },
        ],
      });

      const narrative = result.response.text();
      return NextResponse.json({ narrative });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
