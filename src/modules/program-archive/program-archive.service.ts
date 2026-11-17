import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { ProgramArchive } from '@prisma/client';
import { PrismaService } from '@database/prisma/prisma.service';
import { EntityNotFoundException } from '@common/exceptions';
import {
  CreateProgramArchiveBodyDto,
  UpdateProgramArchiveBodyDto,
  ProgramArchiveMapper,
  ProgramArchiveResponseDto,
} from './dto/program-archive.dto';

@Injectable()
export class ProgramArchiveService {
  private readonly logger = new Logger(ProgramArchiveService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ProgramArchiveResponseDto[]> {
    const items = await this.prisma.programArchive.findMany({ orderBy: { year: 'desc' } });
    return items.map(ProgramArchiveMapper.toResponse);
  }

  async findById(id: string): Promise<ProgramArchiveResponseDto> {
    return ProgramArchiveMapper.toResponse(await this.getOrThrow(id));
  }

  async create(dto: CreateProgramArchiveBodyDto): Promise<ProgramArchiveResponseDto> {
    await this.ensureYearAvailable(dto.year);
    const archive = await this.prisma.programArchive.create({ data: dto });
    this.logger.log(`Program archive created: ${archive.id} (${archive.year})`);
    return ProgramArchiveMapper.toResponse(archive);
  }

  async update(id: string, dto: UpdateProgramArchiveBodyDto): Promise<ProgramArchiveResponseDto> {
    const existing = await this.getOrThrow(id);
    if (dto.year !== undefined && dto.year !== existing.year) {
      await this.ensureYearAvailable(dto.year);
    }
    const archive = await this.prisma.programArchive.update({
      where: { id },
      data: { year: dto.year, gdriveUrl: dto.gdriveUrl },
    });
    this.logger.log(`Program archive updated: ${id}`);
    return ProgramArchiveMapper.toResponse(archive);
  }

  async remove(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.prisma.programArchive.delete({ where: { id } });
    this.logger.log(`Program archive deleted: ${id}`);
  }

  private async getOrThrow(id: string): Promise<ProgramArchive> {
    const archive = await this.prisma.programArchive.findUnique({ where: { id } });
    if (!archive) {
      throw new EntityNotFoundException('ProgramArchive', id);
    }
    return archive;
  }

  private async ensureYearAvailable(year: number): Promise<void> {
    const existing = await this.prisma.programArchive.findUnique({ where: { year } });
    if (existing) {
      throw new ConflictException(`Program archive for year ${year} already exists.`);
    }
  }
}
