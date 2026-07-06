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

export class AssignUserDto {
  @ApiProperty({ example: '3cff6c0a-276d-4bf9-b502-a8113a01478d' })
  userId!: string;

  @ApiProperty({ example: 'PIC' })
  type!: string;
}

export class AssignUnitPayloadDto {
  @ApiProperty({ type: [AssignUserDto] })
  users!: AssignUserDto[];
}
