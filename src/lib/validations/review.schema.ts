import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),

  comment: z.string().max(1000, "Comment must be 1000 characters or fewer").optional(),

  is_anonymous: z.boolean().default(false),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
