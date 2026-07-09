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
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiPaginatedResponse(OutputResponseDto)
  async findByActivity(@Param('id') activityId: string) {
    return this.outputService.findByActivityId(activityId);
  }

  @Post('activities/:id/outputs')
  @ApiOperation({ summary: 'Create output for an activity' })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 201, description: 'Output created', type: OutputResponseDto })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['metricType', 'target', 'unit'],
      properties: {
        metricType: { type: 'string', example: 'Publication' },
        target: { type: 'number', example: 5 },
        realization: { type: 'number', example: 0 },
        unit: { type: 'string', example: 'pcs' },
        description: { type: 'string', example: 'Jumlah publikasi yang ditargetkan' },
      },
    },
  })
  async create(
    @Param('id') activityId: string,
    @Body(new ZodValidationPipe(createOutputSchema)) dto: CreateOutputDto,
  ) {
    return this.outputService.create(activityId, dto);
  }

  @Patch('outputs/:id')
  @ApiOperation({ summary: 'Update output' })
  @ApiParam({ name: 'id', description: 'Output UUID' })
  @ApiResponse({ status: 200, type: OutputResponseDto })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOutputSchema)) dto: UpdateOutputDto,
  ) {
    return this.outputService.update(id, dto);
  }

  @Delete('outputs/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete output' })
  @ApiParam({ name: 'id', description: 'Output UUID' })
  async remove(@Param('id') id: string) {
    await this.outputService.remove(id);
    return { message: 'Output deleted successfully' };
  }
}
