import { Injectable } from '@nestjs/common';
import { Document, Prisma } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';
import { IDocumentRepository } from './document.repository.interface';

@Injectable()
export class DocumentRepository implements IDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByActivityId(activityId: string): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: { activityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Document | null> {
    return this.prisma.document.findUnique({ where: { id } });
  }

  async create(data: Prisma.DocumentCreateInput): Promise<Document> {
    return this.prisma.document.create({ data });
  }

  async delete(id: string): Promise<Document> {
    return this.prisma.document.delete({ where: { id } });
  }
}
