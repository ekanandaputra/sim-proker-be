import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
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
  async findAll(@Param('programId') programId: string, @Req() req: Request) {
    const token = req.headers.authorization as string;
    return this.indicatorService.findAllByProgramId(programId, token);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new indicator for a program' })
  @ApiParam({ name: 'programId', description: 'Program UUID', type: 'string' })
  @ApiBody({ type: CreateProgramIndicatorDto })
  @ApiResponse({ status: 201, type: ProgramIndicatorResponseDto })
  async create(
    @Param('programId') programId: string,
    @Body(new ZodValidationPipe(createProgramIndicatorSchema)) dto: CreateProgramIndicatorDto,
    @Req() req: any
  ) {
    const user = { id: req.user?.id, name: req.user?.name };
    const token = req.headers.authorization as string;
    return this.indicatorService.create(programId, dto, user, token);
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
    @Body(new ZodValidationPipe(updateProgramIndicatorSchema)) dto: UpdateProgramIndicatorDto,
    @Req() req: any
  ) {
    const user = { id: req.user?.id, name: req.user?.name };
    const token = req.headers.authorization as string;
    return this.indicatorService.update(programId, id, dto, user, token);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an indicator' })
  @ApiParam({ name: 'programId', description: 'Program UUID', type: 'string' })
  @ApiParam({ name: 'id', description: 'Indicator UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  async remove(@Param('programId') programId: string, @Param('id') id: string, @Req() req: any) {
    const user = { id: req.user?.id, name: req.user?.name };
    await this.indicatorService.remove(programId, id, user);
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
    @Body(new ZodValidationPipe(setIndicatorTargetSchema)) dto: SetIndicatorTargetDto,
    @Req() req: any
  ) {
    const user = { id: req.user?.id, name: req.user?.name };
    return this.indicatorService.setTarget(programId, id, dto, user);
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
    @Body(new ZodValidationPipe(programIndicatorRealizationSchema)) dto: CreateProgramIndicatorRealizationDto,
    @Req() req: any
  ) {
    const user = { id: req.user?.id, name: req.user?.name };
    return this.indicatorService.upsertRealization(programId, id, dto, user);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Get users for an indicator based on its unitId' })
  @ApiParam({ name: 'programId', description: 'Program UUID', type: 'string' })
  @ApiParam({ name: 'id', description: 'Indicator UUID', type: 'string' })
  @ApiResponse({ status: 200 })
  async getIndicatorUnitUsers(
    @Param('programId') programId: string,
    @Param('id') id: string,
    @Req() req: Request
  ) {
    const token = req.headers.authorization as string;
    return this.indicatorService.getIndicatorUnitUsers(programId, id, token);
  }
}
