import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MasterBudgetService } from './master-budget.service';
import { 
  CreateMasterBudgetDto, 
  UpdateMasterBudgetBudgetDto, 
  UpdateMasterBudgetRealizationDto,
  MasterBudgetDto,
  createMasterBudgetSchema,
  updateMasterBudgetBudgetSchema,
  updateMasterBudgetRealizationSchema
} from './dto/master-budget.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated-response.decorator';
import { paginationQuerySchema, PaginationQuery } from '@common/dto/pagination.dto';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants';

@ApiTags('Master Budget')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('master-budgets')
export class MasterBudgetController {
  constructor(private readonly masterBudgetService: MasterBudgetService) {}

  @Get()
  @ApiOperation({ summary: 'Get all master budgets' })
  @ApiPaginatedResponse(MasterBudgetDto)
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search keyword (year)' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order (asc/desc)' })
  async findAll(
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery,
  ) {
    return this.masterBudgetService.findAll(query);
  }

  @Get(':year')
  @ApiOperation({ summary: 'Get master budget by year' })
  @ApiParam({ name: 'year', type: Number, description: 'Tahun budget (e.g. 2024)' })
  @ApiResponse({ status: 200, type: MasterBudgetDto })
  async findByYear(@Param('year') year: string) {
    return this.masterBudgetService.findByYear(Number(year));
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create new master budget' })
  @ApiResponse({ status: 201, type: MasterBudgetDto })
  async create(
    @Body(new ZodValidationPipe(createMasterBudgetSchema)) dto: CreateMasterBudgetDto,
  ) {
    return this.masterBudgetService.create(dto);
  }

  @Patch(':year/budget')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update master budget total amount' })
  @ApiParam({ name: 'year', type: Number, description: 'Tahun budget yang akan diupdate (e.g. 2024)' })
  @ApiResponse({ status: 200, type: MasterBudgetDto })
  async updateBudget(
    @Param('year') year: string,
    @Body(new ZodValidationPipe(updateMasterBudgetBudgetSchema)) dto: UpdateMasterBudgetBudgetDto,
  ) {
    return this.masterBudgetService.updateBudget(Number(year), dto);
  }

  @Patch(':year/realization')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update master budget realization amount' })
  @ApiParam({ name: 'year', type: Number, description: 'Tahun budget yang akan diupdate realisasinya (e.g. 2024)' })
  @ApiResponse({ status: 200, type: MasterBudgetDto })
  async updateRealization(
    @Param('year') year: string,
    @Body(new ZodValidationPipe(updateMasterBudgetRealizationSchema)) dto: UpdateMasterBudgetRealizationDto,
  ) {
    return this.masterBudgetService.updateRealization(Number(year), dto);
  }

  @Delete(':year')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete master budget' })
  @ApiParam({ name: 'year', type: Number, description: 'Tahun budget yang akan dihapus (e.g. 2024)' })
  @ApiResponse({ status: 200, description: 'Master budget successfully deleted' })
  async remove(@Param('year') year: string) {
    await this.masterBudgetService.remove(Number(year));
    return { message: 'Master budget successfully deleted' };
  }
}
