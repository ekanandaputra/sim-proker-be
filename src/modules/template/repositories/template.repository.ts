import { Injectable } from '@nestjs/common';
import { Template, TemplateType } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';
import { ITemplateRepository, UpsertTemplateData } from './template.repository.interface';

@Injectable()
export class TemplateRepository implements ITemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Template[]> {
    return this.prisma.template.findMany({ orderBy: { type: 'asc' } });
  }

  async findByType(type: TemplateType): Promise<Template | null> {
    return this.prisma.template.findUnique({ where: { type } });
  }

  async upsert(type: TemplateType, data: UpsertTemplateData): Promise<Template> {
    return this.prisma.template.upsert({
      where: { type },
      create: { type, ...data },
      update: data,
    });
  }
}
