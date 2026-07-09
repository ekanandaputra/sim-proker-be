import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';

export class AuditLogResponseDto {
  @ApiProperty({ description: 'Audit log UUID' })
  id!: string;

  @ApiProperty({ enum: AuditAction, description: 'Action performed' })
  action!: AuditAction;

  @ApiProperty({ description: 'Entity type (e.g. Program, Activity)' })
  entityType!: string;

  @ApiProperty({ description: 'Entity UUID' })
  entityId!: string;

  @ApiProperty({ description: 'User ID who performed the action' })
  userId!: string;

  @ApiPropertyOptional({ description: 'User name who performed the action' })
  userName?: string | null;

  @ApiPropertyOptional({ description: 'Snapshot before change', type: Object })
  oldValue?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Snapshot after change', type: Object })
  newValue?: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Client IP address' })
  ipAddress?: string | null;

  @ApiPropertyOptional({ description: 'Client user agent' })
  userAgent?: string | null;

  @ApiProperty({ description: 'Timestamp when the action occurred' })
  createdAt!: Date;
}
