import { Controller, Get, UseGuards, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { AdminDashboardResponseDto, UnitDashboardResponseDto } from '../dto/dashboard-response.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { IndicatorCategory, ProgramStatus } from '@prisma/client';
import { BudgetRecapService } from '../services/budget-recap.service';
import {
  BudgetRecapQuery,
  BudgetRecapResponseDto,
  budgetRecapQuerySchema,
} from '../dto/budget-recap.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly budgetRecapService: BudgetRecapService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get admin dashboard statistics',
    description: 'Returns aggregated statistics including total programs, indicators, activities, and breakdowns by unit/status.',
  })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Optional: Filter by year to retrieve specific master budget. Defaults to the current year.' })
  @ApiResponse({ status: 200, type: AdminDashboardResponseDto })
  async getDashboard(@Query('year') year?: string) {
    const yearNumber = year ? Number(year) : new Date().getFullYear();
    return this.dashboardService.getAdminDashboard(yearNumber);
  }

  @Get('unit')
  @ApiOperation({
    summary: 'Get unit dashboard statistics',
    description: 'Returns aggregated statistics specific to the authenticated user\'s unit.',
  })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Optional: Filter by year to retrieve specific master budget. Defaults to the current year.' })
  @ApiResponse({ status: 200, type: UnitDashboardResponseDto })
  async getUnitDashboard(
    @CurrentUser('unitId') unitId: string,
    @Query('year') year?: string
  ) {
    const yearNumber = year ? Number(year) : new Date().getFullYear();
    return this.dashboardService.getUnitDashboard(unitId, yearNumber);
  }

  @Get('budget-recap')
  @ApiOperation({
    summary: 'Get budget recap per unit (Rekap Anggaran Unit Kerja)',
    description:
      'Aggregates program indicator budgets for one year: summary totals, indicator count per status, ' +
      'one row per unit (sorted by total budget) and the full indicator list with program, unit and PIC names. ' +
      'ADMIN sees every unit; other roles only the units they belong to. ' +
      'Unit and PIC names fall back to their IDs when the Auth Service is unavailable.',
  })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Tahun anggaran (program year). Defaults to the current year.', example: 2026 })
  @ApiQuery({ name: 'unitId', required: false, type: String, description: 'Filter by unit ID' })
  @ApiQuery({ name: 'category', required: false, enum: IndicatorCategory, description: 'Filter by indicator category' })
  @ApiQuery({ name: 'status', required: false, enum: ProgramStatus, description: 'Filter by indicator status' })
  @ApiResponse({ status: 200, type: BudgetRecapResponseDto })
  async getBudgetRecap(
    @Query(new ZodValidationPipe(budgetRecapQuerySchema)) query: BudgetRecapQuery,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
  ) {
    return this.budgetRecapService.getRecap(query, user, req.headers.authorization || '');
  }
}
