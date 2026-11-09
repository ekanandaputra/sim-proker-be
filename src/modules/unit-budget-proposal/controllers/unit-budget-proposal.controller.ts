import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { JwtAuthGuard, JwtPayload } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated-response.decorator';
import { UnitBudgetProposalService } from '../services/unit-budget-proposal.service';
import { UnitBudgetProposalExportService } from '../services/unit-budget-proposal-export.service';
import {
  ExportUnitBudgetProposalQuery,
  exportUnitBudgetProposalQuerySchema,
  MyUnitBudgetProposalQuery,
  MyUnitBudgetProposalResponseDto,
  myUnitBudgetProposalQuerySchema,
  UnitBudgetProposalQuery,
  UnitBudgetProposalResponseDto,
  UpsertUnitBudgetProposalDto,
  unitBudgetProposalQuerySchema,
  upsertUnitBudgetProposalSchema,
} from '../dto/unit-budget-proposal.dto';
import { ApiMessageResponse } from '@common/decorators/api-response-schema.decorator';
import { ApiFileResponse } from '@common/decorators/api-response-schema.decorator';

@ApiTags('Proposed Unit Budget')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('unit-budget-proposals')
export class UnitBudgetProposalController {
  constructor(
    private readonly unitBudgetProposalService: UnitBudgetProposalService,
    private readonly unitBudgetProposalExportService: UnitBudgetProposalExportService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all proposed unit budgets',
    description: 'ADMIN sees all units; other roles only see the units they belong to.',
  })
  @ApiPaginatedResponse(UnitBudgetProposalResponseDto)
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
  })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Filter by year' })
  @ApiQuery({ name: 'unitId', required: false, type: String, description: 'Filter by Unit ID' })
  async findAll(
    @Query(new ZodValidationPipe(unitBudgetProposalQuerySchema)) query: UnitBudgetProposalQuery,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.unitBudgetProposalService.findAll(query, user, req.headers.authorization);
  }

  @Get('export')
  @ApiOperation({
    summary: 'Export proposed unit budgets to Excel',
    description:
      'Downloads one .xlsx file for the given year. Sheet "Ringkasan" contains the grand total of all ' +
      'proposals, totals grouped by category (Perbaikan, Bahan Habis, Peralatan, Pelatihan, Meubelair) ' +
      'and a recap per unit; it is followed by one sheet per unit with its proposal detail. ' +
      'ADMIN exports all units; other roles only the units they belong to.',
  })
  @ApiQuery({
    name: 'year',
    required: true,
    type: Number,
    description: 'Tahun usulan',
    example: 2026,
  })
  @ApiFileResponse({
    fileName: 'Usulan_Anggaran_Unit_<year>.xlsx',
    description: 'File Excel (.xlsx) siap diunduh',
  })
  async export(
    @Query(new ZodValidationPipe(exportUnitBudgetProposalQuerySchema))
    query: ExportUnitBudgetProposalQuery,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const buffer = await this.unitBudgetProposalExportService.exportExcel(
      query.year,
      user,
      req.headers.authorization || '',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Usulan_Anggaran_Unit_${query.year}.xlsx"`,
    );
    res.send(buffer);
  }

  @Get('my-units')
  @ApiOperation({
    summary: 'Get proposed budgets for all units of the current user',
    description:
      'Returns entries for every unit assigned to the current user (same units as GET /units/my-units). ' +
      'With `year`: one entry per unit for that year, `proposal` is null when the unit has not filled it yet. ' +
      'Without `year`: one entry per unit per year that has a proposal (newest year first); units without any proposal get a single entry for the current year with `proposal` null.',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Tahun usulan. Kosongkan untuk mengambil semua tahun.',
  })
  @ApiResponse({ status: 200, type: [MyUnitBudgetProposalResponseDto] })
  async findMyUnits(
    @Query(new ZodValidationPipe(myUnitBudgetProposalQuerySchema)) query: MyUnitBudgetProposalQuery,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.unitBudgetProposalService.findMyUnits(
      query.year,
      user,
      req.headers.authorization || '',
    );
  }

  @Get(':unitId/:year')
  @ApiOperation({ summary: 'Get proposed unit budget by unit and year' })
  @ApiParam({ name: 'unitId', type: String, description: 'Unit ID' })
  @ApiParam({ name: 'year', type: Number, description: 'Tahun usulan (e.g. 2026)' })
  @ApiResponse({ status: 200, type: UnitBudgetProposalResponseDto })
  @ApiResponse({ status: 404, description: 'No proposal yet for this unit and year' })
  async findOne(
    @Param('unitId') unitId: string,
    @Param('year', ParseIntPipe) year: number,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.unitBudgetProposalService.findByUnitAndYear(
      unitId,
      year,
      user,
      req.headers.authorization,
    );
  }

  @Put(':unitId/:year')
  @ApiOperation({
    summary: 'Create or update proposed unit budget',
    description:
      'Creates the record for the unit/year if it does not exist yet, otherwise updates it. Only fields present in the body are changed; pass null to clear a field. Upload documents first via POST /documents/upload.',
  })
  @ApiParam({ name: 'unitId', type: String, description: 'Unit ID' })
  @ApiParam({ name: 'year', type: Number, description: 'Tahun usulan (e.g. 2026)' })
  @ApiBody({ type: UpsertUnitBudgetProposalDto })
  @ApiResponse({ status: 200, type: UnitBudgetProposalResponseDto })
  async upsert(
    @Param('unitId') unitId: string,
    @Param('year', ParseIntPipe) year: number,
    @Body(new ZodValidationPipe(upsertUnitBudgetProposalSchema)) dto: UpsertUnitBudgetProposalDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.unitBudgetProposalService.upsert(
      unitId,
      year,
      dto,
      user,
      req.headers.authorization,
    );
  }

  @Delete(':unitId/:year')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete proposed unit budget' })
  @ApiParam({ name: 'unitId', type: String, description: 'Unit ID' })
  @ApiParam({ name: 'year', type: Number, description: 'Tahun usulan (e.g. 2026)' })
  @ApiMessageResponse('Proposed unit budget successfully deleted')
  async remove(
    @Param('unitId') unitId: string,
    @Param('year', ParseIntPipe) year: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.unitBudgetProposalService.remove(unitId, year, user);
    return { message: 'Proposed unit budget successfully deleted' };
  }
}
