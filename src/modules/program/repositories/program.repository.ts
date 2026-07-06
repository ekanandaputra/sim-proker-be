import { Injectable } from '@nestjs/common';
import { Program, Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';
import { IProgramRepository } from './program.repository.interface';

@Injectable()
export class ProgramRepository implements IProgramRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip: number;
    take: number;
    where?: Prisma.ProgramWhereInput;
    orderBy?: Prisma.ProgramOrderByWithRelationInput;
    include?: Prisma.ProgramInclude;
  }): Promise<Program[]> {
    return this.prisma.program.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy ?? { createdAt: 'desc' },
      include: params.include ?? { category: true },
    });
  }

  async count(where?: Prisma.ProgramWhereInput): Promise<number> {
    return this.prisma.program.count({ where });
  }

  async findById(id: string, include?: Prisma.ProgramInclude): Promise<Program | null> {
    return this.prisma.program.findUnique({
      where: { id },
      include: include ?? {
        category: true,
        activities: true,
        members: true,
        approvals: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async findByCode(code: string): Promise<Program | null> {
    return this.prisma.program.findUnique({ where: { code } });
  }

  async create(data: Prisma.ProgramCreateInput): Promise<Program> {
    return this.prisma.program.create({
      data,
      include: { category: true },
    });
  }

  async update(id: string, data: Prisma.ProgramUpdateInput): Promise<Program> {
    return this.prisma.program.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async delete(id: string): Promise<Program> {
    return this.prisma.program.delete({ where: { id } });
  }
}
