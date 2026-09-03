import { Injectable, Inject, Logger } from '@nestjs/common';
import 'multer';
import { TemplateType } from '@prisma/client';
import { TEMPLATE_REPOSITORY, ITemplateRepository } from '../repositories/template.repository.interface';
import { STORAGE_SERVICE, IStorageService } from '@common/storage/storage.interface';
import { TemplateMapper, TemplateResponseDto } from '../dto/template.dto';
import { EntityNotFoundException } from '@common/exceptions';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    @Inject(TEMPLATE_REPOSITORY) private readonly templateRepository: ITemplateRepository,
    @Inject(STORAGE_SERVICE) private readonly storageService: IStorageService,
  ) {}

  async findAll(): Promise<TemplateResponseDto[]> {
    const templates = await this.templateRepository.findAll();
    return templates.map((t) => TemplateMapper.toResponse(t, this.storageService.getUrl(t.filePath)));
  }

  async upload(type: TemplateType, file: Express.Multer.File, userId: string): Promise<TemplateResponseDto> {
    const existing = await this.templateRepository.findByType(type);

    const filePath = await this.storageService.upload(file, 'templates');

    const template = await this.templateRepository.upsert(type, {
      fileName: file.originalname,
      filePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedBy: userId,
    });

    if (existing) {
      await this.storageService.delete(existing.filePath);
    }

    this.logger.log(`Template ${type} uploaded/replaced by ${userId}`);
    return TemplateMapper.toResponse(template, this.storageService.getUrl(template.filePath));
  }

  async download(type: TemplateType): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const template = await this.templateRepository.findByType(type);
    if (!template) {
      throw new EntityNotFoundException('Template', type);
    }

    const buffer = await this.storageService.read(template.filePath);
    return { buffer, fileName: template.fileName, mimeType: template.mimeType };
  }
}
