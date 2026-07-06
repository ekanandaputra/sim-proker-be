import { Injectable } from '@nestjs/common';
import { ProgressLog, Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';
import { IProgressRepository } from './progress.repository.interface';

@Injectable()
export class ProgressRepository implements IProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByActivityId(activityId: string): Promise<ProgressLog[]> {
    return this.prisma.progressLog.findMany({
      where: { activityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.ProgressLogCreateInput): Promise<ProgressLog> {
    return this.prisma.progressLog.create({ data });
  }

  async getLatestByActivityId(activityId: string): Promise<ProgressLog | null> {
    return this.prisma.progressLog.findFirst({
      where: { activityId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
