import { z } from 'zod';

export const protectionLevelSchema = z.enum(['monitor', 'restricted', 'core']);

export const zoneFormSchema = z.object({
  name: z.string().min(2, 'Give the zone a name your team will recognise.').max(80),
  protectionLevel: protectionLevelSchema,
  notes: z.string().max(1000).optional(),
});

export type ZoneFormValues = z.infer<typeof zoneFormSchema>;
