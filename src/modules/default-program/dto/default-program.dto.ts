import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';

export const createDefaultProgramSchema = z.object({
  ikuId: z.string().min(1, 'ikuId is required'),
  ikuCode: z.string().min(1, 'ikuCode is required'),
  title: z.string().min(1, 'title is required'),
  description: z.string().optional(),
});

export class CreateDefaultProgramDto {
  @ApiProperty()
  ikuId!: string;

  @ApiProperty()
  ikuCode!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ required: false })
  description?: string;
}

export const updateDefaultProgramSchema = createDefaultProgramSchema.partial();

export class UpdateDefaultProgramDto {
  @ApiProperty({ required: false })
  ikuId?: string;

  @ApiProperty({ required: false })
  ikuCode?: string;

  @ApiProperty({ required: false })
  title?: string;

  @ApiProperty({ required: false })
  description?: string;
}

export class DefaultProgramDto {
  @ApiProperty() id!: string;
  @ApiProperty() ikuId!: string;
  @ApiProperty() ikuCode!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
