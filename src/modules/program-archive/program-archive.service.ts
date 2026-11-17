import { Injectable, Logger, ConflictException } from '@nestjs/common';
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

  async findByYear(year: number): Promise<ProgramArchiveResponseDto> {
    const archive = await this.prisma.programArchive.findUnique({ where: { year } });
    if (!archive) {
      throw new EntityNotFoundException('ProgramArchive', year.toString());
    }
    return ProgramArchiveMapper.toResponse(archive);
  }

  async create(dto: CreateProgramArchiveBodyDto): Promise<ProgramArchiveResponseDto> {
    const existing = await this.prisma.programArchive.findUnique({ where: { year: dto.year } });
    if (existing) {
      throw new ConflictException(`Program archive for year ${dto.year} already exists.`);
    }
    const archive = await this.prisma.programArchive.create({ data: dto });
    this.logger.log(`Program archive created: ${archive.year}`);
    return ProgramArchiveMapper.toResponse(archive);
  }

  async update(year: number, dto: UpdateProgramArchiveBodyDto): Promise<ProgramArchiveResponseDto> {
    await this.findByYear(year);
    const archive = await this.prisma.programArchive.update({
      where: { year },
      data: { gdriveUrl: dto.gdriveUrl },
    });
    this.logger.log(`Program archive updated: ${year}`);
    return ProgramArchiveMapper.toResponse(archive);
  }

  async remove(year: number): Promise<void> {
    await this.findByYear(year);
    await this.prisma.programArchive.delete({ where: { year } });
    this.logger.log(`Program archive deleted: ${year}`);
  }
}
