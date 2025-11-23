import { z } from 'zod';

export const generateSchema = z.object({
  prompt: z.string().min(1).max(3000), // cap prompt length
  language: z.enum(['javascript', 'python', 'cpp', 'java']),
});
export type GenerateInput = z.infer<typeof generateSchema>;