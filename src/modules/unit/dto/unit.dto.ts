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

export class UnitDetailDataDto {
  @ApiProperty({ example: "50c42d0a-e798-4d41-be97-31593d422bbe" })
  id!: string;

  @ApiProperty({ example: "Unit baru" })
  name!: string;

  @ApiProperty({ example: "Contoh update", required: false })
  description?: string;

  @ApiProperty({ example: "2026-07-16T05:57:46.935Z" })
  createdAt!: string;

  @ApiProperty({ example: "2026-07-16T05:57:53.912Z" })
  updatedAt!: string;
}

export class UnitUserDetailDto {
  @ApiProperty({ example: "3fa85f64-5717-4562-b3fc-2c963f66afa6" })
  id!: string;

  @ApiProperty({ example: "user@example.com" })
  email!: string;

  @ApiProperty({ example: "string", required: false })
  name?: string;

  @ApiProperty({ example: "string", required: false })
  nip?: string;

  @ApiProperty({ example: "EMPLOYEE", required: false })
  type?: string;

  @ApiProperty({ example: true, required: false })
  isActive?: boolean;

  @ApiProperty({ example: "2026-07-21T04:46:27.563Z", required: false })
  deletedAt?: string;

  @ApiProperty({ example: "2026-07-21T04:46:27.563Z" })
  createdAt!: string;

  @ApiProperty({ example: "2026-07-21T04:46:27.563Z" })
  updatedAt!: string;
}

export class IkuMetadataDto {
  @ApiProperty({ example: "69391cba-5eeb-4218-80fd-596e2c096171" })
  id!: string;

  @ApiProperty({ example: "IKU 4.2" })
  code!: string;

  @ApiProperty({ example: "Zona Integritas yang Terdiri dari Wilayah Bebas dari korupsi (WBK)" })
  name!: string;

  @ApiProperty({ example: "number" })
  unit!: string;

  @ApiProperty({ example: true })
  isDirectInput!: boolean;
}

export class UnitIkuDetailDto {
  @ApiProperty({ example: "d48e1cf2-1b39-41a6-8d2b-e9bdd08ff22b" })
  id!: string;

  @ApiProperty({ example: "50c42d0a-e798-4d41-be97-31593d422bbe" })
  unitId!: string;

  @ApiProperty({ example: "69391cba-5eeb-4218-80fd-596e2c096171" })
  ikuId!: string;

  @ApiProperty({ example: "2026-07-21T04:37:50.533Z" })
  createdAt!: string;

  @ApiProperty({ type: IkuMetadataDto })
  iku!: IkuMetadataDto;
}

export class UnitDetailsResponseDto {
  @ApiProperty({ type: UnitDetailDataDto })
  unit!: UnitDetailDataDto;

  @ApiProperty({ type: [UnitUserDetailDto] })
  users!: UnitUserDetailDto[];

  @ApiProperty({ type: [UnitIkuDetailDto] })
  ikus!: UnitIkuDetailDto[];
}
