import { Output, Prisma } from '@prisma/client';

export interface IOutputRepository {
  findByActivityId(activityId: string): Promise<Output[]>;
  findById(id: string): Promise<Output | null>;
  create(data: Prisma.OutputCreateInput): Promise<Output>;
  update(id: string, data: Prisma.OutputUpdateInput): Promise<Output>;
  delete(id: string): Promise<Output>;
  findByProgramIds(programIds: string[]): Promise<(Output & { activity: { programId: string } })[]>;
}
export const OUTPUT_REPOSITORY = Symbol('OUTPUT_REPOSITORY');
