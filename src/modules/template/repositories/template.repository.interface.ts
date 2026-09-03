import { Template, TemplateType } from '@prisma/client';

export interface UpsertTemplateData {
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedBy: string;
}

export interface ITemplateRepository {
  findAll(): Promise<Template[]>;
  findByType(type: TemplateType): Promise<Template | null>;
  upsert(type: TemplateType, data: UpsertTemplateData): Promise<Template>;
}
export const TEMPLATE_REPOSITORY = Symbol('TEMPLATE_REPOSITORY');
