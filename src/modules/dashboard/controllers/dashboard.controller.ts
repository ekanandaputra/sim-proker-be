import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { AdminDashboardResponseDto, UnitDashboardResponseDto } from '../dto/dashboard-response.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Get admin dashboard statistics',
    description: 'Returns aggregated statistics including total programs, indicators, activities, and breakdowns by unit/status.',
  })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Optional: Filter by year to retrieve specific master budget' })
  @ApiResponse({ status: 200, type: AdminDashboardResponseDto })
  async getDashboard(@Query('year') year?: string) {
    const yearNumber = year ? Number(year) : undefined;
    return this.dashboardService.getAdminDashboard(yearNumber);
  }

  @Get('unit')
  @ApiOperation({
    summary: 'Get unit dashboard statistics',
    description: 'Returns aggregated statistics specific to the authenticated user\'s unit.',
  })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Optional: Filter by year to retrieve specific master budget' })
  @ApiResponse({ status: 200, type: UnitDashboardResponseDto })
  async getUnitDashboard(
    @CurrentUser('unitId') unitId: string,
    @Query('year') year?: string
  ) {
    const yearNumber = year ? Number(year) : undefined;
    return this.dashboardService.getUnitDashboard(unitId, yearNumber);
  }
}
