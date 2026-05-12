import { z } from 'zod';

export const emailSchema = z.object({
  email: z.string().email('That email looks off. Check the spelling and try again.'),
});

export type EmailFormValues = z.infer<typeof emailSchema>;

// Supabase Email OTP length is configurable (6 or 8 digits by default).
// Accept any reasonable length so the same client works against either config.
export const otpSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^\d{4,10}$/u, 'Enter the code from your email.'),
});

export type OtpFormValues = z.infer<typeof otpSchema>;
