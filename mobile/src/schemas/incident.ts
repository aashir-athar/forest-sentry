import { z } from 'zod';

export const incidentSeveritySchema = z.enum(['observation', 'minor', 'serious', 'critical']);

export const incidentFormSchema = z.object({
  severity: incidentSeveritySchema,
  notes: z.string().min(4, 'Add a quick note — context now saves an hour later.').max(1000),
});

export type IncidentFormValues = z.infer<typeof incidentFormSchema>;
