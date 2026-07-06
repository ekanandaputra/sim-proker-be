import { Approval, Prisma } from '@prisma/client';

export interface IApprovalRepository {
  findByProgramId(programId: string): Promise<Approval[]>;
  findById(id: string): Promise<Approval | null>;
  create(data: Prisma.ApprovalCreateInput): Promise<Approval>;
  update(id: string, data: Prisma.ApprovalUpdateInput): Promise<Approval>;
  findLatestByProgramId(programId: string): Promise<Approval | null>;
}
export const APPROVAL_REPOSITORY = Symbol('APPROVAL_REPOSITORY');
