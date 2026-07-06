import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { DashboardResponseDto } from '../dto/dashboard-response.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description: 'Returns aggregated statistics including total programs, budgets, completion rates, and breakdowns by unit/status.',
  })
  @ApiResponse({ status: 200, type: DashboardResponseDto })
  async getDashboard() {
    return this.dashboardService.getDashboard();
  }
}
