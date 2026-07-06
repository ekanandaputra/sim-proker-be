import { z } from 'zod';

export const createActivitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  weight: z.number().min(0).max(100).default(0),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(
  (data) => data.endDate > data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] },
);

export type CreateActivityDto = z.infer<typeof createActivitySchema>;

export const updateActivitySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  weight: z.number().min(0).max(100).optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type UpdateActivityDto = z.infer<typeof updateActivitySchema>;
