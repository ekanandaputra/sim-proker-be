import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, JwtPayload } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated-response.decorator';
import { UnitBudgetProposalService } from '../services/unit-budget-proposal.service';
import {
  UnitBudgetProposalQuery,
  UnitBudgetProposalResponseDto,
  UpsertUnitBudgetProposalDto,
  unitBudgetProposalQuerySchema,
  upsertUnitBudgetProposalSchema,
} from '../dto/unit-budget-proposal.dto';

@ApiTags('Proposed Unit Budget')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('unit-budget-proposals')
export class UnitBudgetProposalController {
  constructor(private readonly unitBudgetProposalService: UnitBudgetProposalService) {}

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
  @ApiResponse({ status: 200, description: 'Proposed unit budget successfully deleted' })
  async remove(
    @Param('unitId') unitId: string,
    @Param('year', ParseIntPipe) year: number,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.unitBudgetProposalService.remove(unitId, year, user);
    return { message: 'Proposed unit budget successfully deleted' };
  }
}
