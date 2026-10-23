import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, JwtPayload } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ProgramIndicatorService } from '../services/program-indicator.service';
import { CreateProgramIndicatorDto, UpdateProgramIndicatorDto, UpdateProgramIndicatorStatusDto, updateProgramIndicatorStatusSchema, ProgramIndicatorResponseDto, createProgramIndicatorSchema, updateProgramIndicatorSchema, SubmitIndicatorTargetDto, submitIndicatorTargetSchema } from '../dto/program-indicator.dto';
import { CreateProgramIndicatorRealizationDto, ProgramIndicatorRealizationResponseDto, programIndicatorRealizationSchema } from '../dto/program-indicator-realization.dto';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated-response.decorator';
import { AuthUserDto } from '../../external/auth-integration/dto/auth-integration.dto';

@ApiTags('Program Indicators')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('programs/:programId/indicators')
export class ProgramIndicatorController {
  constructor(private readonly indicatorService: ProgramIndicatorService) {}

  @Get()
  @ApiOperation({ summary: 'Get all indicators for a program' })
  @ApiParam({ name: 'programId', description: 'Program UUID', type: 'string' })
  @ApiResponse({ status: 200, type: [ProgramIndicatorResponseDto] })
  async findAll(
    @Param('programId') programId: string,
    @Req() req: Request,
    @CurrentUser() user: JwtPayload,
  ) {
    const token = req.headers.authorization as string;
    return this.indicatorService.findAllByProgramId(programId, token, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new indicator for a program' })
  @ApiParam({ name: 'programId', description: 'Program UUID', type: 'string' })
  @ApiBody({ type: CreateProgramIndicatorDto })
  @ApiResponse({ status: 201, type: ProgramIndicatorResponseDto })
  async create(
    @Param('programId') programId: string,
    @Body(new ZodValidationPipe(createProgramIndicatorSchema)) dto: CreateProgramIndicatorDto,
    @Req() req: Request,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const user = { id: currentUser.userId, name: currentUser.name };
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
    @Req() req: Request,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const user = { id: currentUser.userId, name: currentUser.name };
    const token = req.headers.authorization as string;
    return this.indicatorService.update(programId, id, dto, user, token);
  }

  @Patch(':id/status')
  @ApiOperation({
    operationId: 'updateProgramIndicatorStatus',
    summary: 'Update status indikator',
    description: 'Memperbarui status indikator pada program yang diberikan dan mencatat perubahan pada audit log. Field status wajib diisi dengan salah satu nilai enum pada schema.',
  })
  @ApiParam({ name: 'programId', description: 'Program UUID', type: 'string' })
  @ApiParam({ name: 'id', description: 'Indicator UUID', type: 'string' })
  @ApiBody({ type: UpdateProgramIndicatorStatusDto, examples: {
    submitted: { summary: 'Ubah menjadi SUBMITTED', value: { status: 'SUBMITTED' } },
    approved: { summary: 'Ubah menjadi APPROVED', value: { status: 'APPROVED' } },
    inProgress: { summary: 'Ubah menjadi IN_PROGRESS', value: { status: 'IN_PROGRESS' } },
  } })
  @ApiResponse({ status: 200, type: ProgramIndicatorResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 404, description: 'Indicator not found in the program' })
  async updateStatus(
    @Param('programId') programId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProgramIndicatorStatusSchema)) dto: UpdateProgramIndicatorStatusDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const user = { id: currentUser.userId, name: currentUser.name };
    return this.indicatorService.updateStatus(programId, id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an indicator' })
  @ApiParam({ name: 'programId', description: 'Program UUID', type: 'string' })
  @ApiParam({ name: 'id', description: 'Indicator UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  async remove(@Param('programId') programId: string, @Param('id') id: string, @CurrentUser() currentUser: JwtPayload) {
    const user = { id: currentUser.userId, name: currentUser.name };
    await this.indicatorService.remove(programId, id, user);
    return { success: true };
  }

  @Post(':id/set-target')
  @ApiOperation({ summary: 'Set indicator targets', description: 'Proposal (`propsal`) and RAB (`rab`) document UUIDs are required. Upload both files through POST /documents/upload before submitting.' })
  @ApiParam({ name: 'programId', description: 'Program UUID', type: 'string' })
  @ApiParam({ name: 'id', description: 'Indicator UUID', type: 'string' })
  @ApiBody({ type: SubmitIndicatorTargetDto })
  @ApiResponse({ status: 400, description: 'Validasi gagal. Gunakan message untuk notifikasi dan errors untuk pesan per field.', schema: {
    example: {
      isSuccess: false,
      message: 'Dokumen proposal wajib dilampirkan. Dokumen RAB wajib dilampirkan.',
      errors: [
        { field: 'propsal', message: 'Dokumen proposal wajib dilampirkan.' },
        { field: 'rab', message: 'Dokumen RAB wajib dilampirkan.' },
      ],
    },
  } })
  @ApiResponse({ status: 200, type: ProgramIndicatorResponseDto })
  async setTarget(
    @Param('programId') programId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(submitIndicatorTargetSchema, true)) dto: SubmitIndicatorTargetDto,
    @Req() req: Request,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const user = { id: currentUser.userId, name: currentUser.name };
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
    @Req() req: Request,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const user = { id: currentUser.userId, name: currentUser.name };
    return this.indicatorService.upsertRealization(programId, id, dto, user);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Get users for an indicator based on its unitId' })
  @ApiParam({ name: 'programId', description: 'Program UUID', type: 'string' })
  @ApiParam({ name: 'id', description: 'Indicator UUID', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiPaginatedResponse(AuthUserDto)
  async getIndicatorUnitUsers(
    @Param('programId') programId: string,
    @Param('id') id: string,
    @Req() req: Request,
    @Query() query: any
  ) {
    const token = req.headers.authorization as string;
    return this.indicatorService.getIndicatorUnitUsers(programId, id, token, query);
  }
}
