import {
  GoogleGenerativeAI,
  type GenerationConfig,
} from "@google/generative-ai";

const GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.6-flash"];
const MAX_ATTEMPTS_PER_MODEL = 2;
const DEFAULT_MAX_OUTPUT_TOKENS = 4096;
const THINKING_BUDGET = 512;

const RETRYABLE =
  /\b(429|500|502|503)\b|overload|high demand|temporarily|fetch failed|network|timeout|unavailable/i;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ThinkingBudget = { thinkingConfig: { thinkingBudget: number } };

type CallGeminiOptions = {
  maxOutputTokens?: number;
  json?: boolean;
};

export async function callGemini(
  prompt: string,
  options?: CallGeminiOptions
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  let lastError: unknown = null;
  for (const modelId of GEMINI_MODELS) {
    const model = genAI.getGenerativeModel({
      model: modelId,
      generationConfig: {
        maxOutputTokens: options?.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
        thinkingConfig: { thinkingBudget: THINKING_BUDGET },
        ...(options?.json ? { responseMimeType: "application/json" } : {}),
      } as GenerationConfig & ThinkingBudget,
    });
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_MODEL; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        lastError = err;
        const message = err instanceof Error ? err.message : String(err);
        if (!RETRYABLE.test(message)) throw err;
        await sleep(1000 * (attempt + 1));
      }
    }
  }
  throw lastError;
}
