import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ProgressService } from '../services/progress.service';
import { createProgressSchema, CreateProgressDto, ProgressResponseDto } from '../dto/progress.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtPayload } from '@common/guards';

@ApiTags('Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('activities/:id/progress')
  @ApiOperation({ summary: 'List progress logs for an activity', description: 'Returns progress history in descending order.' })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 200, type: [ProgressResponseDto] })
  async findByActivity(@Param('id') activityId: string) {
    return this.progressService.findByActivityId(activityId);
  }

  @Post('activities/:id/progress')
  @ApiOperation({ summary: 'Log progress for an activity', description: 'Creates a new progress log entry. Never updates previous logs.' })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 201, type: ProgressResponseDto })
  async create(
    @Param('id') activityId: string,
    @Body(new ZodValidationPipe(createProgressSchema)) dto: CreateProgressDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.progressService.create(activityId, dto, user.userId);
  }
}
