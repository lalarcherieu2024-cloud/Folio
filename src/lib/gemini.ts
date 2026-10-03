import { ApiError, GoogleGenAI, type ContentListUnion } from "@google/genai";
import { z } from "zod";

// One place that talks to Gemini: structured JSON out, model fallback on overload.
// "-latest" aliases follow Google's current models so a retirement can't break us.
export function geminiConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

export const FAST_MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest"]; // quick interactive answers
export const SMART_MODELS = ["gemini-flash-latest", "gemini-flash-lite-latest"]; // heavier reading (CVs)

export async function generateStructured<T extends z.ZodType>(opts: { system: string; contents: ContentListUnion; schema: T; maxOutputTokens?: number; models?: string[]; timeoutMs?: number }): Promise<z.infer<T>> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const config = { systemInstruction: opts.system, responseMimeType: "application/json", responseJsonSchema: z.toJSONSchema(opts.schema), maxOutputTokens: opts.maxOutputTokens ?? 4000, httpOptions: { timeout: opts.timeoutMs ?? 25000 } };
  const models = [...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []), ...(opts.models ?? SMART_MODELS)];
  let text: string | undefined;
  for (const [i, model] of models.entries()) {
    try {
      text = (await ai.models.generateContent({ model, contents: opts.contents, config })).text;
      break;
    } catch (err) {
      const busy = (err instanceof ApiError && (err.status >= 500 || err.status === 429)) || (err instanceof Error && /timeout|timed out|aborted/i.test(err.message));
      if (!busy || i === models.length - 1) throw err;
    }
  }
  const parsed = opts.schema.safeParse(JSON.parse(text ?? "null"));
  if (!parsed.success) throw new Error("The model returned an unexpected shape.");
  return parsed.data;
}
