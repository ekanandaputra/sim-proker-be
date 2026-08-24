import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { ProgramService } from '../services/program.service';
import { ProgramExportService } from '../services/program-export.service';
import { ProgramIndicatorImportService } from '../services/program-indicator-import.service';
import {
  createProgramSchema,
  CreateProgramDto,
  updateProgramSchema,
  UpdateProgramDto,
  assignProgramSchema,
  AssignProgramDto,
  programQuerySchema,
  ProgramResponseDto,
} from '../dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated-response.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { Role } from '@common/constants';
import { PaginatedResponse } from '@common/dto';

@ApiTags('Programs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('programs')
export class ProgramController {
  constructor(
    private readonly programService: ProgramService,
    private readonly programExportService: ProgramExportService,
    private readonly indicatorImportService: ProgramIndicatorImportService,
  ) {}

  @Get('export/proker')
  @ApiOperation({
    summary: 'Export program indicators to Excel',
    description: 'Export all indicators for a specific unit and year to a styled Excel format.',
  })
  @ApiQuery({ name: 'unitId', required: false, type: String })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async exportProker(
    @Query('unitId') unitId: string,
    @Query('year') year: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const token = req.headers.authorization as string;
    return this.programExportService.exportProker(unitId, Number(year), token, res);
  }

  // ─── Bulk Assign: Export Template ─────────────────────────────────────────

  @Get('indicators/export-assign')
  @Roles(Role.ADMIN, Role.UNIT_ADMIN)
  @ApiOperation({
    summary: 'Export template Excel assign indikator ke unit',
    description:
      'Download file Excel berisi daftar semua indikator beserta kolom Unit Pelaksana yang sudah terisi. ' +
      'File ini bisa diisi/diubah kemudian di-upload kembali via endpoint import. ' +
      'Format kolom: Nama Program | Indikator Unit | Unit Pelaksana.',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: 'Tahun program kerja yang akan diekspor',
    example: 2026,
  })
  @ApiResponse({
    status: 200,
    description: 'File Excel (.xlsx) siap diunduh',
    headers: {
      'Content-Disposition': {
        description: 'attachment; filename="assign_indikator_<year>.xlsx"',
        schema: { type: 'string' },
      },
    },
  })
  async exportIndicatorAssignTemplate(
    @Query('year') year: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const token = req.headers.authorization as string;
    return this.indicatorImportService.exportTemplate(Number(year) || new Date().getFullYear(), token, res);
  }

  // ─── Bulk Assign: Import ───────────────────────────────────────────────────

  @Post('indicators/import-assign')
  @Roles(Role.ADMIN, Role.UNIT_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Import bulk assign indikator ke unit via Excel',
    description:
      'Upload file Excel (.xlsx) untuk melakukan bulk assign indikator ke unit pelaksana. ' +
      'Format kolom wajib: **Nama Program** | **Indikator Unit** | **Unit Pelaksana**. ' +
      'Pencarian program menggunakan nama program (exact match, case-insensitive). ' +
      'Pencarian unit menggunakan nama unit dari auth service (exact match, case-insensitive). ' +
      'Baris yang tidak ditemukan salah satu datanya akan di-skip (tidak error). ' +
      'Response mencakup ringkasan: total baris, jumlah sukses, jumlah skip, dan detail per baris.',
  })
  @ApiBody({
    description: 'File Excel (.xlsx) dengan kolom: Nama Program | Indikator Unit | Unit Pelaksana',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File Excel (.xlsx) berisi mapping indikator ke unit',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Hasil proses import',
    schema: {
      example: {
        totalRows: 5,
        success: 4,
        skipped: 1,
        details: [
          {
            row: 2,
            program: 'Peningkatan Kualitas Laporan',
            indicator: 'Jumlah laporan diterbitkan',
            unit: 'BAK',
            status: 'success',
          },
          {
            row: 3,
            program: 'Program Tidak Dikenal',
            indicator: 'Indikator X',
            unit: 'BAK',
            status: 'skipped',
            reason: 'Program "Program Tidak Dikenal" tidak ditemukan',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'File tidak valid atau format tidak sesuai' })
  async importIndicatorAssign(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const token = req.headers.authorization as string;
    return this.indicatorImportService.importFromExcel(file, token);
  }

  @Get()
  @ApiOperation({
    summary: 'List programs',
    description: 'Get a paginated list of programs with filtering, search, and sorting support.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ASSIGNED_TO_UNIT', 'DRAFT', 'SUBMITTED', 'REVISION', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'unitId', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiPaginatedResponse(ProgramResponseDto)
  async findAll(
    @Query(new ZodValidationPipe(programQuerySchema)) query: PaginatedResponse<ProgramResponseDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.programService.findAll(query as unknown as import('../dto/program-query.dto').ProgramQueryDto, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get program by ID',
    description: 'Get a single program with its related activities, members, and approvals.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Program UUID' })
  @ApiResponse({ status: 200, description: 'Program found', type: ProgramResponseDto })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async findById(@Param('id') id: string) {
    return this.programService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.UNIT_ADMIN, Role.PIC)
  @ApiOperation({
    summary: 'Create program',
    description: 'Create a new program kerja. Requires Admin, Unit Admin, or PIC role.',
  })
  @ApiBody({ type: CreateProgramDto })
  @ApiResponse({ status: 201, description: 'Program created', type: ProgramResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Program code already exists' })
  async create(
    @Body(new ZodValidationPipe(createProgramSchema)) dto: CreateProgramDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.programService.create(dto, user.userId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.UNIT_ADMIN, Role.PIC)
  @ApiOperation({
    summary: 'Update program',
    description: 'Partially update an existing program.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Program UUID' })
  @ApiBody({ type: UpdateProgramDto })
  @ApiResponse({ status: 200, description: 'Program updated', type: ProgramResponseDto })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProgramSchema)) dto: UpdateProgramDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.programService.update(id, dto, user.userId);
  }

  @Post(':id/assign')
  @Roles(Role.ADMIN, Role.UNIT_ADMIN)
  @ApiOperation({
    summary: 'Assign program to unit for a new year',
    description: 'Clone an existing program for a new year and optionally assign it to a unit. Automatically sets status to ASSIGNED_TO_UNIT.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Program UUID to clone' })
  @ApiBody({ type: AssignProgramDto })
  @ApiResponse({ status: 201, description: 'Program cloned and assigned', type: ProgramResponseDto })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async assignToUnit(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(assignProgramSchema)) dto: AssignProgramDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.programService.assignToUnit(id, dto, user.userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.UNIT_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete program',
    description: 'Delete a program. Requires Admin or Unit Admin role.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Program UUID' })
  @ApiResponse({ status: 200, description: 'Program deleted' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.programService.remove(id, user.userId);
    return { message: 'Program deleted successfully' };
  }
}
