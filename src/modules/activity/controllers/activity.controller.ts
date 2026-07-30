import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ActivityService } from '../services/activity.service';
import { createActivitySchema, CreateActivityDto, updateActivitySchema, UpdateActivityDto } from '../dto/activity.dto';
import { ActivityResponseDto } from '../dto/activity-response.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated-response.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('programs/:id/activities')
  @ApiOperation({ summary: 'List activities for a program', description: 'Returns a paginated list of activities for a given program' })
  @ApiParam({ name: 'id', description: 'Program UUID', type: 'string' })
  @ApiPaginatedResponse(ActivityResponseDto)
  async findByProgram(@Param('id') programId: string) {
    return this.activityService.findByProgramId(programId);
  }

  @Post('programs/:id/activities')
  @ApiOperation({ summary: 'Create activity under a program', description: 'Adds a new activity to the specified program' })
  @ApiParam({ name: 'id', description: 'Program UUID', type: 'string' })
  @ApiResponse({ status: 201, description: 'Activity created', type: ActivityResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  @ApiBody({ type: CreateActivityDto })
  async create(
    @Param('id') programId: string,
    @Body(new ZodValidationPipe(createActivitySchema)) dto: CreateActivityDto,
  ) {
    return this.activityService.create(programId, dto);
  }

  @Patch('activities/:id')
  @ApiOperation({ summary: 'Update activity' })
  @ApiParam({ name: 'id', description: 'Activity UUID', type: 'string' })
  @ApiBody({ type: UpdateActivityDto })
  @ApiResponse({ status: 200, description: 'Activity updated', type: ActivityResponseDto })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateActivitySchema)) dto: UpdateActivityDto,
  ) {
    return this.activityService.update(id, dto);
  }

  @Delete('activities/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete activity', description: 'Deletes an activity permanently' })
  @ApiParam({ name: 'id', description: 'Activity UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Activity deleted successfully' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async remove(@Param('id') id: string) {
    await this.activityService.remove(id);
    return { message: 'Activity deleted successfully' };
  }
}
