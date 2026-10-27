import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiPropertyOptional({ type: String, nullable: true, example: '198001012005011001', description: 'Employee NIP, preserved as text' }) nip?: string | null;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'User UUID' }) id!: string;
  @ApiProperty({ example: 'Budi Santoso', description: 'Full name' }) name!: string;
  @ApiProperty({ example: 'budi@example.com', description: 'Email address' }) email!: string;
  @ApiProperty({ nullable: true, example: '550e8400-e29b-41d4-a716-446655440001', description: 'Unit UUID the user belongs to' }) unitId!: string | null;
  @ApiProperty({ type: [String], example: ['ADMIN', 'PIC'], description: 'List of roles' }) roles!: string[];
}

export class AuthUnitDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Unit UUID' }) id!: string;
  @ApiProperty({ example: 'UNT-01', description: 'Unit code' }) code!: string;
  @ApiProperty({ example: 'Fakultas Teknik', description: 'Unit name' }) name!: string;
  @ApiProperty({ nullable: true, example: '550e8400-e29b-41d4-a716-446655440002', description: 'Parent unit UUID if any' }) parentId!: string | null;
}
