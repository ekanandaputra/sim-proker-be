import { Injectable } from '@nestjs/common';
import { Approval, Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';
import { IApprovalRepository } from './approval.repository.interface';

@Injectable()
export class ApprovalRepository implements IApprovalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByIndicatorId(indicatorId: string): Promise<Approval[]> {
    return this.prisma.approval.findMany({
      where: { indicatorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Approval | null> {
    return this.prisma.approval.findUnique({ where: { id } });
  }

  async create(data: Prisma.ApprovalCreateInput): Promise<Approval> {
    return this.prisma.approval.create({ data });
  }

  async update(id: string, data: Prisma.ApprovalUpdateInput): Promise<Approval> {
    return this.prisma.approval.update({ where: { id }, data });
  }

  async findLatestByIndicatorId(indicatorId: string): Promise<Approval | null> {
    return this.prisma.approval.findFirst({
      where: { indicatorId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
