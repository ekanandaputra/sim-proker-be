import { ApiProperty } from '@nestjs/swagger';

export class IkuDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'IKU UUID' }) id!: string;
  @ApiProperty({ example: 'IKU-01', description: 'IKU Code' }) code!: string;
  @ApiProperty({ example: 'Indikator Kinerja Utama 1', description: 'IKU Name' }) name!: string;
  @ApiProperty({ nullable: true, example: 'Deskripsi indikator', description: 'Detailed description of the IKU' }) description!: string | null;
  @ApiProperty({ example: 'STRATEGIS', description: 'Type of IKU' }) type!: string;
  @ApiProperty({ example: true, description: 'Whether the IKU requires direct input' }) isDirectInput!: boolean;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001', description: 'Unit UUID related to this IKU' }) unit!: string;
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation timestamp' }) createdAt!: string;
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update timestamp' }) updatedAt!: string;
}
