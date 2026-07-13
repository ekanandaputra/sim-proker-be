import { ApiProperty } from '@nestjs/swagger';

export class IkuDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty() type!: string;
  @ApiProperty() isDirectInput!: boolean;
  @ApiProperty() unit!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
