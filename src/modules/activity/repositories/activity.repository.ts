import { Injectable } from '@nestjs/common';
import { Activity, Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';
import { IActivityRepository } from './activity.repository.interface';

@Injectable()
export class ActivityRepository implements IActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProgramId(programId: string): Promise<Activity[]> {
    return this.prisma.activity.findMany({
      where: { programId },
      orderBy: { createdAt: 'asc' },
      include: { outputs: true, progressLogs: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
  }

  async findById(id: string): Promise<Activity | null> {
    return this.prisma.activity.findUnique({
      where: { id },
      include: { outputs: true, progressLogs: { orderBy: { createdAt: 'desc' } }, evidences: true },
    });
  }

  async create(data: Prisma.ActivityCreateInput): Promise<Activity> {
    return this.prisma.activity.create({ data });
  }

  async update(id: string, data: Prisma.ActivityUpdateInput): Promise<Activity> {
    return this.prisma.activity.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Activity> {
    return this.prisma.activity.delete({ where: { id } });
  }
}
