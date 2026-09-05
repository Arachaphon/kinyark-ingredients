import { callGemini as callGeminiShared } from "@/lib/ai/gemini-client";
import OpenAI from "openai";
import { buildIngredientPrompt } from "./prompts";
import {
  generateMenuRequestSchema,
  generateMenuResponseSchema,
  type GenerateMenuRequest,
  type GenerateMenuResponse,
} from "@/lib/validations/ai.schema";

async function callGemini(prompt: string): Promise<string> {
  return callGeminiShared(prompt);
}

async function callGroq(prompt: string): Promise<string> {
  const groq = new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
  });

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "openai/gpt-oss-120b", // 👈 model ฟรีที่ Groq แนะนำ
  });

  return completion.choices[0].message.content ?? "";
}

export async function generateRecipeFromIngredients(
  input: GenerateMenuRequest
): Promise<GenerateMenuResponse> {
  const { ingredients, userContext, provider } = generateMenuRequestSchema.parse(input);

  const prompt = buildIngredientPrompt(ingredients, userContext);

  const rawText =
    provider === "groq" ? await callGroq(prompt) : await callGemini(prompt);

  const cleaned = rawText.replace(/```json|```/g, "").trim();

  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    throw new Error("AI ตอบกลับไม่ใช่ JSON ที่ถูกต้อง");
  }

  const parsed = generateMenuResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.error("AI response ไม่ตรง schema:", parsed.error.flatten());
    throw new Error("AI ตอบกลับไม่ตรงตามโครงสร้างที่กำหนด");
  }

  return parsed.data;
}