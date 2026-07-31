import { Document, Prisma } from '@prisma/client';

export interface IDocumentRepository {
  findByActivityId(activityId: string): Promise<Document[]>;
  findById(id: string): Promise<Document | null>;
  create(data: Prisma.DocumentCreateInput): Promise<Document>;
  delete(id: string): Promise<Document>;
}
export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');
