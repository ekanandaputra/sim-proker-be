import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import 'multer';
import { extname } from 'path';
import { Prisma } from '@prisma/client';
import { GUIDE_REPOSITORY, IGuideRepository } from '../repositories/guide.repository.interface';
import { STORAGE_SERVICE, IStorageService } from '@common/storage/storage.interface';
import {
  GuideMapper,
  GuideResponseDto,
  CreateGuideBodyDto,
  UpdateGuideBodyDto,
} from '../dto/guide.dto';
import { PaginatedResponse, PaginationQuery } from '@common/dto/pagination.dto';
import { buildPaginationArgs, buildPaginatedResponse } from '@common/utils/pagination.util';
import { EntityNotFoundException } from '@common/exceptions';

@Injectable()
export class GuideService {
  private readonly logger = new Logger(GuideService.name);

  constructor(
    @Inject(GUIDE_REPOSITORY) private readonly guideRepository: IGuideRepository,
    @Inject(STORAGE_SERVICE) private readonly storageService: IStorageService,
  ) {}

  private toResponse(g: Parameters<typeof GuideMapper.toResponse>[0]): GuideResponseDto {
    const url = g.filePath ? this.storageService.getUrl(g.filePath) : null;
    return GuideMapper.toResponse(g, url);
  }

  private sanitizeTitle(title: string): string {
    return title
      .trim()
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_');
  }

  private buildStorageFileName(title: string): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
    return `${this.sanitizeTitle(title)}_${timestamp}`;
  }

  async findAll(query: PaginationQuery): Promise<PaginatedResponse<GuideResponseDto>> {
    const { skip, take, orderBy } = buildPaginationArgs(query);

    const where: Prisma.GuideWhereInput = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    const [items, totalItems] = await Promise.all([
      this.guideRepository.findAll({ skip, take, where, orderBy }),
      this.guideRepository.count(where),
    ]);

    return buildPaginatedResponse(
      items.map((g) => this.toResponse(g)),
      totalItems,
      query,
    );
  }

  async findById(id: string): Promise<GuideResponseDto> {
    const guide = await this.guideRepository.findById(id);
    if (!guide) {
      throw new EntityNotFoundException('Guide', id);
    }
    return this.toResponse(guide);
  }

  async create(
    dto: CreateGuideBodyDto,
    file: Express.Multer.File | undefined,
    userId: string,
  ): Promise<GuideResponseDto> {
    if (!file && !dto.videoUrl) {
      throw new BadRequestException('Either a guide file or a video URL must be provided');
    }

    let filePath: string | undefined;
    if (file) {
      filePath = await this.storageService.upload(
        file,
        'guides',
        this.buildStorageFileName(dto.title),
      );
    }

    const guide = await this.guideRepository.create({
      title: dto.title,
      description: dto.description,
      fileName: file?.originalname,
      filePath,
      mimeType: file?.mimetype,
      fileSize: file?.size,
      videoUrl: dto.videoUrl,
      uploadedBy: userId,
    });

    this.logger.log(`Guide created: ${guide.id} by ${userId}`);
    return this.toResponse(guide);
  }

  async update(
    id: string,
    dto: UpdateGuideBodyDto,
    file: Express.Multer.File | undefined,
  ): Promise<GuideResponseDto> {
    const existing = await this.guideRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Guide', id);
    }

    let filePath: string | undefined;
    if (file) {
      const titleForFileName = dto.title ?? existing.title;
      filePath = await this.storageService.upload(
        file,
        'guides',
        this.buildStorageFileName(titleForFileName),
      );
    }

    const hasFileAfterUpdate = Boolean(filePath ?? existing.filePath);
    const videoUrlAfterUpdate = dto.videoUrl === null ? null : (dto.videoUrl ?? existing.videoUrl);
    if (!hasFileAfterUpdate && !videoUrlAfterUpdate) {
      if (filePath) {
        await this.storageService.delete(filePath);
      }
      throw new BadRequestException('Either a guide file or a video URL must be provided');
    }

    const guide = await this.guideRepository.update(id, {
      title: dto.title,
      description: dto.description,
      videoUrl: dto.videoUrl,
      ...(file
        ? {
            fileName: file.originalname,
            filePath,
            mimeType: file.mimetype,
            fileSize: file.size,
          }
        : {}),
    });

    if (file && existing.filePath) {
      await this.storageService.delete(existing.filePath);
    }

    this.logger.log(`Guide updated: ${id}`);
    return this.toResponse(guide);
  }

  async remove(id: string): Promise<void> {
    const guide = await this.guideRepository.findById(id);
    if (!guide) {
      throw new EntityNotFoundException('Guide', id);
    }

    if (guide.filePath) {
      await this.storageService.delete(guide.filePath);
    }

    await this.guideRepository.delete(id);
    this.logger.log(`Guide deleted: ${id}`);
  }

  async download(id: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const guide = await this.guideRepository.findById(id);
    if (!guide || !guide.filePath || !guide.fileName || !guide.mimeType) {
      throw new EntityNotFoundException('Guide file', id);
    }

    const buffer = await this.storageService.read(guide.filePath);
    const fileName = `${this.sanitizeTitle(guide.title)}${extname(guide.fileName)}`;
    return { buffer, fileName, mimeType: guide.mimeType };
  }
}
