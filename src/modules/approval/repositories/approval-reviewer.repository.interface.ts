import { ApprovalReviewer, ApprovalLevel, Prisma } from '@prisma/client';

export interface IApprovalReviewerRepository {
  create(data: Prisma.ApprovalReviewerCreateInput): Promise<ApprovalReviewer>;
  findAll(filters?: { level?: ApprovalLevel; ikuId?: string }): Promise<ApprovalReviewer[]>;
  findById(id: string): Promise<ApprovalReviewer | null>;
  findByUserAndLevel(userId: string, level: ApprovalLevel, ikuId?: string): Promise<ApprovalReviewer | null>;
  findByUserId(userId: string): Promise<ApprovalReviewer[]>;
  delete(id: string): Promise<ApprovalReviewer>;
  deleteByUserAndLevel(userId: string, level: ApprovalLevel, ikuId?: string): Promise<void>;
}

export const APPROVAL_REVIEWER_REPOSITORY = Symbol('APPROVAL_REVIEWER_REPOSITORY');
