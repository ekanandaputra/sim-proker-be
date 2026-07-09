import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { AuditLogService } from '../services/audit-log.service';
import { auditLogQuerySchema, AuditLogQueryDto, AuditLogResponseDto } from '../dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated-response.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { Role } from '@common/constants';
import { PaginatedResponse } from '@common/dto';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({
    summary: 'List audit logs',
    description:
      'Get a paginated list of audit logs with filtering by entity type, action, user, and date range. Admin only.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'entityType', required: false, type: String, description: 'Filter by entity type (e.g. Program, Activity)' })
  @ApiQuery({ name: 'entityId', required: false, type: String, description: 'Filter by entity UUID' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user UUID' })
  @ApiQuery({
    name: 'action',
    required: false,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'APPROVE', 'REJECT', 'SUBMIT'],
  })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter from date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter to date (ISO 8601)' })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiPaginatedResponse(AuditLogResponseDto)
  async findAll(
    @Query(new ZodValidationPipe(auditLogQuerySchema)) query: PaginatedResponse<AuditLogResponseDto>,
  ) {
    return this.auditLogService.findAll(query as unknown as AuditLogQueryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get audit log by ID',
    description: 'Get a single audit log entry with full details. Admin only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Audit log UUID' })
  @ApiResponse({ status: 200, description: 'Audit log found', type: AuditLogResponseDto })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async findById(@Param('id') id: string) {
    return this.auditLogService.findById(id);
  }
}
