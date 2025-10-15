import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z.string().min(8)
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8)
  })
  .strict();

export const credentialSchema = z
  .object({
    platform: z.string().min(2).max(120),
    username: z.string().min(1).max(120),
    ciphertext: z.string().min(1),
    iv: z.string().min(1)
  })
  .strict();
