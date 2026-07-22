import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';

export class AuditLogResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Audit log UUID' })
  id!: string;

  @ApiProperty({ enum: AuditAction, example: AuditAction.CREATE, description: 'Action performed' })
  action!: AuditAction;

  @ApiProperty({ example: 'Program', description: 'Entity type (e.g. Program, Activity)' })
  entityType!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Entity UUID' })
  entityId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002', description: 'User ID who performed the action' })
  userId!: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'User name who performed the action' })
  userName?: string | null;

  @ApiPropertyOptional({ example: { status: 'DRAFT' }, description: 'Snapshot before change', type: Object })
  oldValue?: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: { status: 'SUBMITTED' }, description: 'Snapshot after change', type: Object })
  newValue?: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: '192.168.1.1', description: 'Client IP address' })
  ipAddress?: string | null;

  @ApiPropertyOptional({ example: 'Mozilla/5.0...', description: 'Client user agent' })
  userAgent?: string | null;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z', description: 'Timestamp when the action occurred' })
  createdAt!: Date;
}
