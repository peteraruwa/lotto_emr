/**
 * Gemini API client wrapper for Lotto Central Hospital bots.
 *
 * Uses the generativelanguage.googleapis.com REST API directly (no SDK dependency).
 * Outbound access to this endpoint must be allowlisted in the nftables firewall.
 *
 * IMPORTANT: Only de-identified patient data may be sent to Gemini.
 * Always run data through the deidentify() function before passing to this client.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-1.5-flash';

export interface GeminiGenerateOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  systemInstruction?: string;
}

export interface GeminiClient {
  generateContent(prompt: string, options?: GeminiGenerateOptions): Promise<string>;
}

export function createGeminiClient(): GeminiClient {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is not set. ' +
        'Set it in your deployment environment or .env.medplum file.'
    );
  }

  return {
    async generateContent(
      prompt: string,
      options: GeminiGenerateOptions = {}
    ): Promise<string> {
      const model = options.model ?? DEFAULT_MODEL;
      const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

      const requestBody: Record<string, unknown> = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: options.temperature ?? 0.3,
          maxOutputTokens: options.maxOutputTokens ?? 2048,
        },
      };

      if (options.systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: options.systemInstruction }],
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Gemini API error: ${response.status} ${response.statusText}\n${errorText}`
        );
      }

      const data = await response.json();

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Gemini API returned empty content');
      }

      return text;
    },
  };
}
