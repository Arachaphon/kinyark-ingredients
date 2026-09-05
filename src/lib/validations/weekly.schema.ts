import { z } from "zod";

/**
 * ใช้ validate โครงสร้าง JSON ที่ AI ตอบกลับมา (ทั้ง seasonal และ trending)
 * ก่อนนำไปบันทึกเป็น Recipe จริงในฐานข้อมูล ผ่าน weekly-recommendation service
 *
 * โครงสร้างนี้สอดคล้องกับ createRecipeSchema (recipe.schema.ts)
 * เพื่อให้สามารถบันทึกผ่าน prisma transaction โดยใช้ Recipe/Ingredient เดิมได้
 */
export const weeklyAiIngredientSchema = z.object({
  name: z.string().trim().min(1, "Ingredient name cannot be empty").max(120),
  quantity: z.coerce.number().positive("Quantity must be greater than 0").max(1_000_000),
  unit: z.string().trim().min(1, "Unit is required").max(30),
});

export const weeklyAiRecipeSchema = z.object({
  recipeName: z.string().trim().min(1, "Recipe name is required").max(150),
  description: z.string().trim().max(1000).optional(),
  instructions: z.string().trim().min(1, "Instructions are required").max(20_000),
  ingredients: z.array(weeklyAiIngredientSchema).default([]),
});

export type WeeklyAiIngredient = z.infer<typeof weeklyAiIngredientSchema>;
export type WeeklyAiRecipe = z.infer<typeof weeklyAiRecipeSchema>;
