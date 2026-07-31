import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildIngredientPrompt } from "./prompts";
import {
  generateMenuRequestSchema,
  generateMenuResponseSchema,
  type GenerateMenuRequest,
  type GenerateMenuResponse,
} from "@/lib/validations/ai.schema";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function generateRecipeFromIngredients(
  input: GenerateMenuRequest
): Promise<GenerateMenuResponse> {
  const { ingredients, userContext } = generateMenuRequestSchema.parse(input);

  const prompt = buildIngredientPrompt(ingredients, userContext);

  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
  const result = await model.generateContent(prompt);
  const rawText = result.response.text();

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