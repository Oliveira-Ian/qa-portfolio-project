import { z } from 'zod';

// Shape/type source only. The exact error messages and check order documented
// in docs/product/auth_rules.md and docs/api/http_responses.md are enforced
// by hand in the API controllers, not by this schema — see authController.ts.
export const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const registerSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  password: z.string(),
  birthDate: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
