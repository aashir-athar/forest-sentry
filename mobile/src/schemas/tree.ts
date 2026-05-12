// Zod schemas — single source of truth for form validation.
import { z } from 'zod';

// Empty-string-tolerant optional number — RHF Inputs send strings.
const optionalNumber = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === '' || v === null) return undefined;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : undefined;
  });

export const treeFormSchema = z.object({
  species: z.string().min(2, 'Pick a species so the record stays useful.').max(80),
  girthCm: optionalNumber.refine((v) => v === undefined || (v > 0 && v <= 1000), { message: 'Girth must be 0-1000 cm.' }),
  heightM: optionalNumber.refine((v) => v === undefined || (v > 0 && v <= 120), { message: 'Height must be 0-120 m.' }),
  notes: z.string().max(1000).optional(),
});

export type TreeFormInput = z.input<typeof treeFormSchema>;
export type TreeFormValues = z.output<typeof treeFormSchema>;
