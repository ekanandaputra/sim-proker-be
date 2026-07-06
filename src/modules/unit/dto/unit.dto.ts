import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUnitDto {
  @ApiProperty({ example: 'Unit A' })
  name!: string;

  @ApiPropertyOptional({ example: 'Description for Unit A' })
  description?: string;
}

export class UpdateUnitDto {
  @ApiPropertyOptional({ example: 'Unit A' })
  name?: string;

  @ApiPropertyOptional({ example: 'Description for Unit A' })
  description?: string;
}
