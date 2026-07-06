import { Injectable } from '@nestjs/common';
import { Evidence, Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';
import { IEvidenceRepository } from './evidence.repository.interface';

@Injectable()
export class EvidenceRepository implements IEvidenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByActivityId(activityId: string): Promise<Evidence[]> {
    return this.prisma.evidence.findMany({
      where: { activityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Evidence | null> {
    return this.prisma.evidence.findUnique({ where: { id } });
  }

  async create(data: Prisma.EvidenceCreateInput): Promise<Evidence> {
    return this.prisma.evidence.create({ data });
  }

  async delete(id: string): Promise<Evidence> {
    return this.prisma.evidence.delete({ where: { id } });
  }
}
