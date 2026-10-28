import { ApprovalReviewer, ApprovalLevel, Prisma } from '@prisma/client';

export interface ApprovalReviewerFilters {
  level?: ApprovalLevel;
  ikuId?: string;
  userId?: string;
}

export type ApprovalReviewerListOptions = Pick<Prisma.ApprovalReviewerFindManyArgs, 'skip' | 'take' | 'orderBy'>;

export interface IApprovalReviewerRepository {
  create(data: Prisma.ApprovalReviewerCreateInput): Promise<ApprovalReviewer>;
  findAll(filters?: ApprovalReviewerFilters, options?: ApprovalReviewerListOptions): Promise<ApprovalReviewer[]>;
  count(filters?: ApprovalReviewerFilters): Promise<number>;
  findById(id: string): Promise<ApprovalReviewer | null>;
  findByUserAndLevel(userId: string, level: ApprovalLevel, ikuId?: string): Promise<ApprovalReviewer | null>;
  findByUserId(userId: string): Promise<ApprovalReviewer[]>;
  delete(id: string): Promise<ApprovalReviewer>;
  deleteByUserAndLevel(userId: string, level: ApprovalLevel, ikuId?: string): Promise<void>;
}

export const APPROVAL_REVIEWER_REPOSITORY = Symbol('APPROVAL_REVIEWER_REPOSITORY');
