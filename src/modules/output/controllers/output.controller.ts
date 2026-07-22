import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { OutputService } from '../services/output.service';
import { createOutputSchema, CreateOutputDto, updateOutputSchema, UpdateOutputDto, OutputResponseDto } from '../dto/output.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated-response.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';

@ApiTags('Outputs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class OutputController {
  constructor(private readonly outputService: OutputService) {}

  @Get('activities/:id/outputs')
  @ApiOperation({ summary: 'List outputs for an activity' })
  @ApiParam({ name: 'id', description: 'Activity UUID', type: 'string' })
  @ApiPaginatedResponse(OutputResponseDto)
  async findByActivity(@Param('id') activityId: string) {
    return this.outputService.findByActivityId(activityId);
  }

  @Post('activities/:id/outputs')
  @ApiOperation({ summary: 'Create output for an activity' })
  @ApiParam({ name: 'id', description: 'Activity UUID', type: 'string' })
  @ApiResponse({ status: 201, description: 'Output created', type: OutputResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @ApiBody({ type: CreateOutputDto })
  async create(
    @Param('id') activityId: string,
    @Body(new ZodValidationPipe(createOutputSchema)) dto: CreateOutputDto,
  ) {
    return this.outputService.create(activityId, dto);
  }

  @Patch('outputs/:id')
  @ApiOperation({ summary: 'Update output' })
  @ApiParam({ name: 'id', description: 'Output UUID', type: 'string' })
  @ApiBody({ type: UpdateOutputDto })
  @ApiResponse({ status: 200, type: OutputResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Output not found' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOutputSchema)) dto: UpdateOutputDto,
  ) {
    return this.outputService.update(id, dto);
  }

  @Delete('outputs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete output' })
  @ApiParam({ name: 'id', description: 'Output UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Output deleted successfully' })
  @ApiResponse({ status: 404, description: 'Output not found' })
  async remove(@Param('id') id: string) {
    await this.outputService.remove(id);
    return { message: 'Output deleted successfully' };
  }
}
