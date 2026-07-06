import { Injectable } from '@nestjs/common';
import { Output, Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';
import { IOutputRepository } from './output.repository.interface';

@Injectable()
export class OutputRepository implements IOutputRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByActivityId(activityId: string): Promise<Output[]> {
    return this.prisma.output.findMany({ where: { activityId }, orderBy: { createdAt: 'asc' } });
  }

  async findById(id: string): Promise<Output | null> {
    return this.prisma.output.findUnique({ where: { id } });
  }

  async create(data: Prisma.OutputCreateInput): Promise<Output> {
    return this.prisma.output.create({ data });
  }

  async update(id: string, data: Prisma.OutputUpdateInput): Promise<Output> {
    return this.prisma.output.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Output> {
    return this.prisma.output.delete({ where: { id } });
  }

  async findByProgramIds(programIds: string[]): Promise<(Output & { activity: { programId: string } })[]> {
    return this.prisma.output.findMany({
      where: { activity: { programId: { in: programIds } } },
      include: { activity: { select: { programId: true } } },
    });
  }
}
