import { Approval, Prisma, ApprovalLevel } from '@prisma/client';

export interface IApprovalRepository {
  findByIndicatorId(indicatorId: string): Promise<Approval[]>;
  findById(id: string): Promise<Approval | null>;
  create(data: Prisma.ApprovalCreateInput): Promise<Approval>;
  update(id: string, data: Prisma.ApprovalUpdateInput): Promise<Approval>;
  findLatestByIndicatorId(indicatorId: string): Promise<Approval | null>;
  findLatestByIndicatorIdAndLevel(indicatorId: string, level: ApprovalLevel): Promise<Approval | null>;
}
export const APPROVAL_REPOSITORY = Symbol('APPROVAL_REPOSITORY');
