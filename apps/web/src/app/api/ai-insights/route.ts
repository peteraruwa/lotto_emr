import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EMR_API_KEY ?? '');

export async function POST(req: NextRequest) {
  if (!process.env.EMR_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured — EMR_API_KEY missing' }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.prompt) {
    return NextResponse.json({ error: 'prompt required' }, { status: 400 });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(body.prompt as string);
    const text = result.response.text();
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
