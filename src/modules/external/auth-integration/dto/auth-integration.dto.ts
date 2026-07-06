import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ nullable: true }) unitId!: string | null;
  @ApiProperty({ type: [String] }) roles!: string[];
}

export class AuthUnitDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true }) parentId!: string | null;
}
