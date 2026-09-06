import { z } from "zod";

export const updateProfileSchema = z.object({
  bio: z.string().trim().max(500).nullable().optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const searchSchema = z.object({
  q: z.string().trim().min(2).max(50),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});
