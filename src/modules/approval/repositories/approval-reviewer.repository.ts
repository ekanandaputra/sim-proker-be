import { Injectable } from '@nestjs/common';
import { ApprovalReviewer, ApprovalLevel, Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';
import { IApprovalReviewerRepository } from './approval-reviewer.repository.interface';

@Injectable()
export class ApprovalReviewerRepository implements IApprovalReviewerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ApprovalReviewerCreateInput): Promise<ApprovalReviewer> {
    return this.prisma.approvalReviewer.create({ data });
  }

  async findAll(filters?: { level?: ApprovalLevel; ikuId?: string }): Promise<ApprovalReviewer[]> {
    const where: Prisma.ApprovalReviewerWhereInput = {};
    if (filters?.level) where.level = filters.level;
    if (filters?.ikuId) where.ikuId = filters.ikuId;

    return this.prisma.approvalReviewer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<ApprovalReviewer | null> {
    return this.prisma.approvalReviewer.findUnique({ where: { id } });
  }

  async findByUserAndLevel(userId: string, level: ApprovalLevel, ikuId?: string): Promise<ApprovalReviewer | null> {
    return this.prisma.approvalReviewer.findFirst({
      where: { userId, level, ...(ikuId ? { ikuId } : {}) },
    });
  }

  async findByUserId(userId: string): Promise<ApprovalReviewer[]> {
    return this.prisma.approvalReviewer.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string): Promise<ApprovalReviewer> {
    return this.prisma.approvalReviewer.delete({ where: { id } });
  }

  async deleteByUserAndLevel(userId: string, level: ApprovalLevel, ikuId?: string): Promise<void> {
    await this.prisma.approvalReviewer.deleteMany({
      where: { userId, level, ...(ikuId ? { ikuId } : {}) },
    });
  }
}
