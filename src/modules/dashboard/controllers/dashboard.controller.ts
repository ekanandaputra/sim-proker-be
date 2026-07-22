import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
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
  @ApiResponse({ status: 200, type: AdminDashboardResponseDto })
  async getDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('unit')
  @ApiOperation({
    summary: 'Get unit dashboard statistics',
    description: 'Returns aggregated statistics specific to the authenticated user\'s unit.',
  })
  @ApiResponse({ status: 200, type: UnitDashboardResponseDto })
  async getUnitDashboard(@CurrentUser('unitId') unitId: string) {
    return this.dashboardService.getUnitDashboard(unitId);
  }
}
