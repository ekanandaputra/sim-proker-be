import { ProgressLog, Prisma } from '@prisma/client';

export interface IProgressRepository {
  findByActivityId(activityId: string): Promise<ProgressLog[]>;
  create(data: Prisma.ProgressLogCreateInput): Promise<ProgressLog>;
  getLatestByActivityId(activityId: string): Promise<ProgressLog | null>;
}
export const PROGRESS_REPOSITORY = Symbol('PROGRESS_REPOSITORY');
