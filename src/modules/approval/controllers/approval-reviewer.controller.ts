import { Controller, Post, Get, Delete, Param, Body, UseGuards, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody, ApiQuery, ApiExtraModels, getSchemaPath, ApiConsumes, ApiProduces } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApprovalReviewerTransferService } from '../services/approval-reviewer-transfer.service';
import { ApprovalReviewerImportResultDto } from '../dto/approval-reviewer-import.dto';
import { ApprovalReviewerService } from '../services/approval-reviewer.service';
import { createApprovalReviewerSchema, CreateApprovalReviewerDto, ApprovalReviewerResponseDto, ApprovalReviewerUserResponseDto } from '../dto/approval-reviewer.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { Role } from '@common/constants';
import { ApprovalLevel } from '@prisma/client';

@ApiTags('Approval Reviewers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiExtraModels(CreateApprovalReviewerDto, ApprovalReviewerResponseDto, ApprovalReviewerImportResultDto, ApprovalReviewerUserResponseDto)
@Controller('approval-reviewers')
export class ApprovalReviewerController {
  constructor(
    private readonly reviewerService: ApprovalReviewerService,
    private readonly transferService: ApprovalReviewerTransferService,
  ) {}

  @Get('users')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'List pengguna yang ditetapkan sebagai approval reviewer',
    description: 'Mengembalikan pengguna unik yang memiliki penugasan reviewer. Mendukung filter level, ikuId, dan pencarian sebagian nama pengguna tanpa membedakan huruf besar/kecil. Jika detail pengguna tidak tersedia, id tetap dikembalikan dengan nama Unknown User.',
  })
  @ApiQuery({ name: 'level', required: false, enum: ApprovalLevel, description: 'Filter by verification level' })
  @ApiQuery({ name: 'ikuId', required: false, type: String, description: 'Filter by assigned IKU ID' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by user name (partial match, case-insensitive)', example: 'budi' })
  @ApiResponse({ status: 200, description: 'Daftar pengguna reviewer tanpa duplikasi', schema: {
    properties: {
      isSuccess: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Success' },
      data: { type: 'array', items: { $ref: getSchemaPath(ApprovalReviewerUserResponseDto) } },
    },
  } })
  async findUsers(
    @Req() req: Request,
    @Query('level') level?: ApprovalLevel,
    @Query('ikuId') ikuId?: string,
    @Query('search') search?: string,
  ) {
    return this.reviewerService.findUsers({ level, ikuId, search }, req.headers.authorization as string);
  }

  @Get('export')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Export reviewer indikator ke Excel', description: 'Kolom: IKU Code | NIP. NIP disimpan sebagai teks. Berisi semua reviewer INDICATOR_VERIFICATION; jika belum ada reviewer, file hanya berisi header dan dapat digunakan sebagai template import.' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({ status: 200, description: 'File Excel reviewer', schema: { type: 'string', format: 'binary' } })
  @ApiResponse({ status: 400, description: 'IKU Code atau NIP reviewer tidak tersedia' })
  async exportExcel(@Req() req: Request, @Res() res: Response) {
    const buffer = await this.transferService.exportExcel(req.headers.authorization as string);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="approval_reviewers.xlsx"');
    res.send(buffer);
  }

  @Post('import')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import reviewer indikator dari Excel', description: 'Upload .xlsx (maksimal 5 MB), sheet pertama, header baris pertama: IKU Code | NIP. Setiap baris membuat penugasan INDICATOR_VERIFICATION. NIP wajib berupa teks dan dicocokkan dengan field nip di Auth Service. IKU Code dicocokkan tanpa membedakan huruf besar/kecil. Baris tidak valid dan duplikat dilewati dengan alasan; baris kosong diabaikan. Penugasan lama tetap tersimpan.' })
  @ApiBody({ schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 201, description: 'Ringkasan dan hasil per baris', schema: { properties: {
    isSuccess: { type: 'boolean', example: true },
    message: { type: 'string', example: 'Success' },
    data: { $ref: getSchemaPath(ApprovalReviewerImportResultDto) },
  } } })
  @ApiResponse({ status: 400, description: 'File atau header Excel tidak valid' })
  @ApiResponse({ status: 413, description: 'Ukuran file melebihi 5 MB' })
  async importExcel(@UploadedFile() file: Express.Multer.File | undefined, @Req() req: Request) {
    return this.transferService.importExcel(file, req.headers.authorization as string);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Assign a reviewer',
    description:
      'Assign a user as a reviewer for a specific verification level.\n\n' +
      '- **INDICATOR_VERIFICATION**: Provide `ikuIds` array to assign the user as indicator reviewer for one or more IKUs.\n' +
      '- **BUDGET_VERIFICATION**: No `ikuIds` needed. The user becomes a global budget reviewer.',
  })
  @ApiBody({
    type: CreateApprovalReviewerDto,
    examples: {
      indicator_reviewer: {
        summary: 'Assign indicator reviewer for multiple IKUs',
        value: {
          userId: '550e8400-e29b-41d4-a716-446655440001',
          level: 'INDICATOR_VERIFICATION',
          ikuIds: ['iku-uuid-001', 'iku-uuid-002', 'iku-uuid-003'],
        },
      },
      budget_reviewer: {
        summary: 'Assign budget reviewer (global)',
        value: {
          userId: '550e8400-e29b-41d4-a716-446655440002',
          level: 'BUDGET_VERIFICATION',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Reviewer(s) assigned successfully. Returns an array of created reviewer assignments.',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ApprovalReviewerResponseDto) },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (e.g., ikuIds missing for INDICATOR_VERIFICATION)',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Validation failed' },
        errors: {
          type: 'array',
          items: { type: 'object', properties: { path: { type: 'string', example: 'ikuIds' }, message: { type: 'string', example: 'ikuIds is required for INDICATOR_VERIFICATION level' } } },
        },
      },
    },
  })
  async create(
    @Body(new ZodValidationPipe(createApprovalReviewerSchema)) dto: CreateApprovalReviewerDto,
    @Req() req: Request
  ) {
    const token = req.headers.authorization as string;
    return this.reviewerService.create(dto, token);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'List all reviewers',
    description: 'Returns all reviewer assignments, optionally filtered by verification level, IKU ID, and/or user ID. Search matches part of the user name OR IKU name, case-insensitively, within the filtered assignments.',
  })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by user name or IKU name (partial match, case-insensitive)', example: 'kinerja' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by reviewer user ID', example: 'user-uuid-001' })
  @ApiQuery({ name: 'level', required: false, enum: ApprovalLevel, description: 'Filter by verification level' })
  @ApiQuery({ name: 'ikuId', required: false, type: String, description: 'Filter by IKU ID (only relevant for INDICATOR_VERIFICATION)' })
  @ApiResponse({
    status: 200,
    description: 'List of reviewer assignments',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ApprovalReviewerResponseDto) },
        },
      },
    },
  })
  async findAll(
    @Req() req: Request,
    @Query('level') level?: ApprovalLevel,
    @Query('ikuId') ikuId?: string,
    @Query('userId') userId?: string,
    @Query('search') search?: string,
  ) {
    const token = req.headers.authorization as string;
    return this.reviewerService.findAll({ level, ikuId, userId, search }, token);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get reviewer by ID', description: 'Returns a single reviewer assignment by its UUID.' })
  @ApiParam({ name: 'id', description: 'Reviewer assignment UUID', type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: 200,
    description: 'Reviewer assignment details',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: { $ref: getSchemaPath(ApprovalReviewerResponseDto) },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Reviewer not found',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'ApprovalReviewer with id 550e8400-... not found' },
      },
    },
  })
  async findById(@Param('id') id: string, @Req() req: Request) {
    const token = req.headers.authorization as string;
    return this.reviewerService.findById(id, token);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remove a reviewer assignment', description: 'Deletes a reviewer assignment by its UUID. The user will no longer be able to review at the assigned level.' })
  @ApiParam({ name: 'id', description: 'Reviewer assignment UUID', type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: 200,
    description: 'Reviewer assignment deleted successfully',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: {
          properties: {
            message: { type: 'string', example: 'Reviewer assignment deleted successfully' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Reviewer not found',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'ApprovalReviewer with id 550e8400-... not found' },
      },
    },
  })
  async delete(@Param('id') id: string) {
    await this.reviewerService.delete(id);
    return { message: 'Reviewer assignment deleted successfully' };
  }
}
