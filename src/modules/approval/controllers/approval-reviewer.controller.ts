import { Controller, Post, Get, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody, ApiQuery, ApiExtraModels } from '@nestjs/swagger';
import { ApprovalReviewerService } from '../services/approval-reviewer.service';
import { createApprovalReviewerSchema, CreateApprovalReviewerDto, ApprovalReviewerResponseDto } from '../dto/approval-reviewer.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { Role } from '@common/constants';
import { ApprovalLevel } from '@prisma/client';

@ApiTags('Approval Reviewers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiExtraModels(CreateApprovalReviewerDto, ApprovalReviewerResponseDto)
@Controller('approval-reviewers')
export class ApprovalReviewerController {
  constructor(private readonly reviewerService: ApprovalReviewerService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Assign a reviewer',
    description:
      'Assign a user as a reviewer for a specific verification level.\n\n' +
      '- **INDICATOR_VERIFICATION**: Provide `ikuIds` array to assign the user as indicator reviewer for one or more IKUs.\n' +
      '- **BUDGET_VERIFICATION**: No `ikuIds` needed. The user becomes a global budget reviewer.',
  })
  @ApiBody({
    type: CreateApprovalReviewerDto,
    examples: {
      indicator_reviewer: {
        summary: 'Assign indicator reviewer for multiple IKUs',
        value: {
          userId: '550e8400-e29b-41d4-a716-446655440001',
          level: 'INDICATOR_VERIFICATION',
          ikuIds: ['iku-uuid-001', 'iku-uuid-002', 'iku-uuid-003'],
        },
      },
      budget_reviewer: {
        summary: 'Assign budget reviewer (global)',
        value: {
          userId: '550e8400-e29b-41d4-a716-446655440002',
          level: 'BUDGET_VERIFICATION',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Reviewer(s) assigned successfully. Returns an array of created reviewer assignments.',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'array',
          items: {
            properties: {
              id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
              userId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440001' },
              level: { type: 'string', enum: ['INDICATOR_VERIFICATION', 'BUDGET_VERIFICATION'], example: 'INDICATOR_VERIFICATION' },
              ikuId: { type: 'string', nullable: true, example: 'iku-uuid-001' },
              createdAt: { type: 'string', format: 'date-time', example: '2026-01-01T00:00:00.000Z' },
              updatedAt: { type: 'string', format: 'date-time', example: '2026-01-01T00:00:00.000Z' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error (e.g., ikuIds missing for INDICATOR_VERIFICATION)',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Validation failed' },
        errors: {
          type: 'array',
          items: { type: 'object', properties: { path: { type: 'string', example: 'ikuIds' }, message: { type: 'string', example: 'ikuIds is required for INDICATOR_VERIFICATION level' } } },
        },
      },
    },
  })
  async create(
    @Body(new ZodValidationPipe(createApprovalReviewerSchema)) dto: CreateApprovalReviewerDto,
  ) {
    return this.reviewerService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'List all reviewers',
    description: 'Returns all reviewer assignments, optionally filtered by verification level and/or IKU ID.',
  })
  @ApiQuery({ name: 'level', required: false, enum: ApprovalLevel, description: 'Filter by verification level' })
  @ApiQuery({ name: 'ikuId', required: false, type: String, description: 'Filter by IKU ID (only relevant for INDICATOR_VERIFICATION)' })
  @ApiResponse({
    status: 200,
    description: 'List of reviewer assignments',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: {
          type: 'array',
          items: {
            properties: {
              id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
              userId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440001' },
              level: { type: 'string', enum: ['INDICATOR_VERIFICATION', 'BUDGET_VERIFICATION'], example: 'INDICATOR_VERIFICATION' },
              ikuId: { type: 'string', nullable: true, example: 'iku-uuid-001' },
              createdAt: { type: 'string', format: 'date-time', example: '2026-01-01T00:00:00.000Z' },
              updatedAt: { type: 'string', format: 'date-time', example: '2026-01-01T00:00:00.000Z' },
            },
          },
        },
      },
    },
  })
  async findAll(
    @Query('level') level?: ApprovalLevel,
    @Query('ikuId') ikuId?: string,
  ) {
    return this.reviewerService.findAll({ level, ikuId });
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get reviewer by ID', description: 'Returns a single reviewer assignment by its UUID.' })
  @ApiParam({ name: 'id', description: 'Reviewer assignment UUID', type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: 200,
    description: 'Reviewer assignment details',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: {
          properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
            userId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440001' },
            level: { type: 'string', enum: ['INDICATOR_VERIFICATION', 'BUDGET_VERIFICATION'], example: 'INDICATOR_VERIFICATION' },
            ikuId: { type: 'string', nullable: true, example: 'iku-uuid-001' },
            createdAt: { type: 'string', format: 'date-time', example: '2026-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2026-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Reviewer not found',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'ApprovalReviewer with id 550e8400-... not found' },
      },
    },
  })
  async findById(@Param('id') id: string) {
    return this.reviewerService.findById(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remove a reviewer assignment', description: 'Deletes a reviewer assignment by its UUID. The user will no longer be able to review at the assigned level.' })
  @ApiParam({ name: 'id', description: 'Reviewer assignment UUID', type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: 200,
    description: 'Reviewer assignment deleted successfully',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: {
          properties: {
            message: { type: 'string', example: 'Reviewer assignment deleted successfully' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Reviewer not found',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'ApprovalReviewer with id 550e8400-... not found' },
      },
    },
  })
  async delete(@Param('id') id: string) {
    await this.reviewerService.delete(id);
    return { message: 'Reviewer assignment deleted successfully' };
  }
}
