import { Program } from '@prisma/client';
import { ProgramResponseDto } from '../dto/program-response.dto';

interface ProgramWithCategory extends Program {
  category?: { name: string } | null;
}

export class ProgramMapper {
  static toResponse(program: ProgramWithCategory): ProgramResponseDto {
    return {
      id: program.id,
      code: program.code,
      title: program.title,
      description: program.description,
      objective: program.objective,
      year: program.year,
      unitId: program.unitId,
      categoryId: program.categoryId,
      categoryName: program.category?.name ?? null,
      status: program.status,
      startDate: program.startDate,
      endDate: program.endDate,
      budget: Number(program.budget),
      createdBy: program.createdBy,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    };
  }

  static toResponseList(programs: ProgramWithCategory[]): ProgramResponseDto[] {
    return programs.map((p) => ProgramMapper.toResponse(p));
  }
}
