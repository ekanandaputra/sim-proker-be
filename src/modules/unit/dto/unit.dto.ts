import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DefaultProgramDto } from '../../default-program/dto/default-program.dto';
import { ProgramStatus } from '@prisma/client';

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

  @ApiProperty({ type: () => [DefaultProgramDto] })
  defaultPrograms!: DefaultProgramDto[];
}

export class UnitDetailsResponseDto {
  @ApiProperty({ type: UnitDetailDataDto })
  unit!: UnitDetailDataDto;

  @ApiProperty({ type: [UnitUserDetailDto] })
  users!: UnitUserDetailDto[];

  @ApiProperty({ type: [UnitIkuDetailDto] })
  ikus!: UnitIkuDetailDto[];
}

export class UnitProgramDto {
  @ApiProperty({ example: "50c42d0a-e798-4d41-be97-31593d422bbe" })
  id!: string;
  
  @ApiProperty({ example: "PRG-01" })
  code!: string;
  
  @ApiProperty({ example: "Program title" })
  title!: string;
  
  @ApiProperty({ example: "description", required: false })
  description?: string | null;
  
  @ApiProperty({ example: "objective", required: false })
  objective?: string | null;
  
  @ApiProperty({ example: 2026 })
  year!: number;
  
  @ApiProperty({ example: "user-id" })
  createdBy!: string;
  
  @ApiProperty({ example: "2026-07-21T04:46:27.563Z" })
  createdAt!: Date;
  
  @ApiProperty({ example: "2026-07-21T04:46:27.563Z" })
  updatedAt!: Date;
}

export class MasterUnitTypeDto {
  @ApiProperty({ example: 'uuid-master-unit-type' })
  id!: string;

  @ApiProperty({ example: 'Dokumen Laporan' })
  name!: string;

  @ApiProperty({ enum: ['NUMBER', 'FILE', 'TEXT'], example: 'NUMBER' })
  type!: string;
}

export class UnitProgramIndicatorRealizationDto {
  @ApiProperty({ example: 'uuid-realization' })
  id!: string;

  @ApiProperty({ example: 1, description: 'Month number (1–12)' })
  month!: number;

  @ApiProperty({ example: 10.5, description: 'Realized value' })
  realization!: number;

  @ApiPropertyOptional({ example: 'On track', description: 'Optional remark' })
  remark?: string | null;
}

export class UnitProgramIndicatorDto {
  @ApiProperty({ example: 'uuid-indicator' })
  id!: string;

  @ApiProperty({ example: 'Jumlah laporan yang diterbitkan', description: 'Indicator name' })
  name!: string;

  @ApiProperty({ enum: ['TUSI', 'RUTIN', 'PENGEMBANGAN'], example: 'TUSI', description: 'Indicator category' })
  category!: string;

  @ApiProperty({ type: MasterUnitTypeDto, description: 'Satuan/tipe pengukuran indikator' })
  masterUnitType!: MasterUnitTypeDto;

  @ApiPropertyOptional({ example: 5, description: 'Target Q1 (nullable if not set)' })
  targetQ1?: number | null;

  @ApiPropertyOptional({ example: 10, description: 'Target Q2 (nullable if not set)' })
  targetQ2?: number | null;

  @ApiPropertyOptional({ example: 15, description: 'Target Q3 (nullable if not set)' })
  targetQ3?: number | null;

  @ApiPropertyOptional({ example: 20, description: 'Target Q4 (nullable if not set)' })
  targetQ4?: number | null;

  @ApiPropertyOptional({ example: 5000000, description: 'Allocated budget for this indicator (nullable)' })
  budget?: number | null;

  @ApiProperty({ enum: ProgramStatus, example: ProgramStatus.SUBMITTED, description: 'Current indicator status' })
  status!: ProgramStatus;

  @ApiProperty({ example: 1, description: 'Display order within the program' })
  order!: number;

  @ApiProperty({
    type: [String],
    example: ['uuid-user-1', 'uuid-user-2'],
    description: 'List of user IDs assigned as PIC for this indicator',
  })
  picIds!: string[];

  @ApiProperty({ type: [UnitProgramIndicatorRealizationDto] })
  realizations!: UnitProgramIndicatorRealizationDto[];
}

export class UnitProgramResponseDto {
  @ApiProperty({ type: UnitProgramDto })
  program!: UnitProgramDto;

  @ApiProperty({ type: [UnitProgramIndicatorDto], description: 'Indicators assigned to this unit for the program' })
  indikator!: UnitProgramIndicatorDto[];
}

export class AssignIkusToUnitDto {
  @ApiProperty({ type: [String], example: ['iku-uuid-1', 'iku-uuid-2'] })
  ikuIds!: string[];
}

export class UnassignIkusFromUnitDto {
  @ApiProperty({ type: [String], example: ['iku-uuid-1', 'iku-uuid-2'] })
  ikuIds!: string[];
}
