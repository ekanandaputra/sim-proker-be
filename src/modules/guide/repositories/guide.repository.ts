import { Injectable } from '@nestjs/common';
import { Guide, Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';
import { IGuideRepository } from './guide.repository.interface';

@Injectable()
export class GuideRepository implements IGuideRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip: number;
    take: number;
    where?: Prisma.GuideWhereInput;
    orderBy?: Prisma.GuideOrderByWithRelationInput;
  }): Promise<Guide[]> {
    return this.prisma.guide.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy ?? { createdAt: 'desc' },
    });
  }

  async count(where?: Prisma.GuideWhereInput): Promise<number> {
    return this.prisma.guide.count({ where });
  }

  async findById(id: string): Promise<Guide | null> {
    return this.prisma.guide.findUnique({ where: { id } });
  }

  async create(data: Prisma.GuideCreateInput): Promise<Guide> {
    return this.prisma.guide.create({ data });
  }

  async update(id: string, data: Prisma.GuideUpdateInput): Promise<Guide> {
    return this.prisma.guide.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Guide> {
    return this.prisma.guide.delete({ where: { id } });
  }
}
