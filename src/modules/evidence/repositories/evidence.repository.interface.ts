import { Evidence, Prisma } from '@prisma/client';

export interface IEvidenceRepository {
  findByActivityId(activityId: string): Promise<Evidence[]>;
  findById(id: string): Promise<Evidence | null>;
  create(data: Prisma.EvidenceCreateInput): Promise<Evidence>;
  delete(id: string): Promise<Evidence>;
}
export const EVIDENCE_REPOSITORY = Symbol('EVIDENCE_REPOSITORY');
