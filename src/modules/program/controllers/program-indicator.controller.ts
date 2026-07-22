import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { ProgramIndicatorService } from '../services/program-indicator.service';
import { CreateProgramIndicatorDto, UpdateProgramIndicatorDto, ProgramIndicatorResponseDto, createProgramIndicatorSchema, updateProgramIndicatorSchema, SetIndicatorTargetDto, setIndicatorTargetSchema } from '../dto/program-indicator.dto';
import { CreateProgramIndicatorRealizationDto, ProgramIndicatorRealizationResponseDto, programIndicatorRealizationSchema } from '../dto/program-indicator-realization.dto';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';

@ApiTags('Program Indicators')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('programs/:programId/indicators')
export class ProgramIndicatorController {
  constructor(private readonly indicatorService: ProgramIndicatorService) {}

  @Get()
  @ApiOperation({ summary: 'Get all indicators for a program' })
  @ApiParam({ name: 'programId', description: 'Program UUID', type: 'string' })
  @ApiResponse({ status: 200, type: () => [ProgramIndicatorResponseDto] })
  async findAll(@Param('programId') programId: string) {
    return this.indicatorService.findAllByProgramId(programId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new indicator for a program' })
  @ApiParam({ name: 'programId', description: 'Program UUID', type: 'string' })
  @ApiBody({ type: CreateProgramIndicatorDto })
  @ApiResponse({ status: 201, type: ProgramIndicatorResponseDto })
  async create(
    @Param('programId') programId: string,
    @Body(new ZodValidationPipe(createProgramIndicatorSchema)) dto: CreateProgramIndicatorDto
  ) {
    return this.indicatorService.create(programId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an indicator' })
  @ApiParam({ name: 'programId', description: 'Program UUID', type: 'string' })
  @ApiParam({ name: 'id', description: 'Indicator UUID', type: 'string' })
  @ApiBody({ type: UpdateProgramIndicatorDto })
  @ApiResponse({ status: 200, type: ProgramIndicatorResponseDto })
  async update(
    @Param('programId') programId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProgramIndicatorSchema)) dto: UpdateProgramIndicatorDto
  ) {
    return this.indicatorService.update(programId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an indicator' })
  @ApiParam({ name: 'programId', description: 'Program UUID', type: 'string' })
  @ApiParam({ name: 'id', description: 'Indicator UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  async remove(@Param('programId') programId: string, @Param('id') id: string) {
    await this.indicatorService.remove(programId, id);
    return { success: true };
  }

  @Post(':id/set-target')
  @ApiOperation({ summary: 'Set targets for an indicator and upgrade status to IN_PROGRESS' })
  @ApiParam({ name: 'programId', description: 'Program UUID', type: 'string' })
  @ApiParam({ name: 'id', description: 'Indicator UUID', type: 'string' })
  @ApiBody({ type: SetIndicatorTargetDto })
  @ApiResponse({ status: 200, type: ProgramIndicatorResponseDto })
  async setTarget(
    @Param('programId') programId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setIndicatorTargetSchema)) dto: SetIndicatorTargetDto
  ) {
    return this.indicatorService.setTarget(programId, id, dto);
  }

  @Get(':id/realizations')
  @ApiOperation({ summary: 'Get realizations for an indicator' })
  @ApiParam({ name: 'programId', description: 'Program UUID', type: 'string' })
  @ApiParam({ name: 'id', description: 'Indicator UUID', type: 'string' })
  @ApiResponse({ status: 200, type: [ProgramIndicatorRealizationResponseDto] })
  async getRealizations(
    @Param('programId') programId: string,
    @Param('id') id: string
  ) {
    return this.indicatorService.getRealizations(programId, id);
  }

  @Post(':id/realizations')
  @ApiOperation({ summary: 'Create or update a realization for a specific month' })
  @ApiParam({ name: 'programId', description: 'Program UUID', type: 'string' })
  @ApiParam({ name: 'id', description: 'Indicator UUID', type: 'string' })
  @ApiBody({ type: CreateProgramIndicatorRealizationDto })
  @ApiResponse({ status: 201, type: ProgramIndicatorRealizationResponseDto })
  async upsertRealization(
    @Param('programId') programId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(programIndicatorRealizationSchema)) dto: CreateProgramIndicatorRealizationDto
  ) {
    return this.indicatorService.upsertRealization(programId, id, dto);
  }
}
