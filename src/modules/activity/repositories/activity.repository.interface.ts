import { Activity, Prisma } from '@prisma/client';

export interface IActivityRepository {
  findByProgramId(programId: string): Promise<Activity[]>;
  findById(id: string): Promise<Activity | null>;
  create(data: Prisma.ActivityCreateInput): Promise<Activity>;
  update(id: string, data: Prisma.ActivityUpdateInput): Promise<Activity>;
  delete(id: string): Promise<Activity>;
}

export const ACTIVITY_REPOSITORY = Symbol('ACTIVITY_REPOSITORY');
