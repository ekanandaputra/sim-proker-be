import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ProgramArchiveService } from './program-archive.service';
import {
  CreateProgramArchiveDto,
  UpdateProgramArchiveDto,
  ProgramArchiveResponseDto,
  CreateProgramArchiveBodyDto,
  UpdateProgramArchiveBodyDto,
  createProgramArchiveSchema,
  updateProgramArchiveSchema,
} from './dto/program-archive.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants';
import { ApiMessageResponse } from '@common/decorators/api-response-schema.decorator';

@ApiTags('Program Archives')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('program-archives')
export class ProgramArchiveController {
  constructor(private readonly programArchiveService: ProgramArchiveService) {}

  @Get()
  @ApiOperation({ summary: 'List arsip proker (tahun & link Google Drive), urut tahun terbaru' })
  @ApiResponse({ status: 200, type: ProgramArchiveResponseDto, isArray: true })
  async findAll() {
    return this.programArchiveService.findAll();
  }

  @Get(':year')
  @ApiOperation({ summary: 'Get arsip proker by tahun' })
  @ApiParam({ name: 'year', type: Number, example: 2025 })
  @ApiResponse({ status: 200, type: ProgramArchiveResponseDto })
  @ApiResponse({ status: 404, description: 'Program archive not found' })
  async findByYear(@Param('year', ParseIntPipe) year: number) {
    return this.programArchiveService.findByYear(year);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create arsip proker (ADMIN only)' })
  @ApiBody({ type: CreateProgramArchiveDto })
  @ApiResponse({ status: 201, type: ProgramArchiveResponseDto })
  @ApiResponse({ status: 409, description: 'Archive for the year already exists' })
  async create(
    @Body(new ZodValidationPipe(createProgramArchiveSchema)) dto: CreateProgramArchiveBodyDto,
  ) {
    return this.programArchiveService.create(dto);
  }

  @Patch(':year')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update link Google Drive arsip proker (ADMIN only)' })
  @ApiBody({ type: UpdateProgramArchiveDto })
  @ApiParam({ name: 'year', type: Number, example: 2025 })
  @ApiResponse({ status: 200, type: ProgramArchiveResponseDto })
  @ApiResponse({ status: 404, description: 'Program archive not found' })
  async update(
    @Param('year', ParseIntPipe) year: number,
    @Body(new ZodValidationPipe(updateProgramArchiveSchema)) dto: UpdateProgramArchiveBodyDto,
  ) {
    return this.programArchiveService.update(year, dto);
  }

  @Delete(':year')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete arsip proker (ADMIN only)' })
  @ApiParam({ name: 'year', type: Number, example: 2025 })
  @ApiMessageResponse('Program archive deleted successfully')
  @ApiResponse({ status: 404, description: 'Program archive not found' })
  async remove(@Param('year', ParseIntPipe) year: number) {
    await this.programArchiveService.remove(year);
    return { message: 'Program archive deleted successfully' };
  }
}
