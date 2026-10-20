import { Program } from '@prisma/client';
import { ProgramResponseDto } from '../dto/program-response.dto';


interface ProgramWithCategory extends Program {
  category?: { name: string } | null;
  indicators?: any[];
}

export class ProgramMapper {
  static toResponse(program: ProgramWithCategory): ProgramResponseDto {
    return {
      id: program.id,
      code: program.code,
      ikuId: program.ikuId,
      title: program.title,
      description: program.description,
      objective: program.objective,
      year: program.year,
      indicators: program.indicators ? program.indicators.map((ind) => ({
        id: ind.id,
        programId: ind.programId,
        unitId: ind.unitId,
        name: ind.name,
        category: ind.category,
        isDefaultProgramIndicator: ind.isDefaultProgramIndicator,
        unit: ind.unit,
        picIds: (ind.pics ?? []).map((pic: { userId: string }) => pic.userId),
        targetQ1: ind.targetQ1 ? Number(ind.targetQ1) : null,
        targetQ2: ind.targetQ2 ? Number(ind.targetQ2) : null,
        targetQ3: ind.targetQ3 ? Number(ind.targetQ3) : null,
        targetQ4: ind.targetQ4 ? Number(ind.targetQ4) : null,
        status: ind.status,
        order: ind.order,
        proposalDocumentId: ind.proposalDocumentId ?? null,
        rabDocumentId: ind.rabDocumentId ?? null,
        proposalDocument: ind.proposalDocument ?? null,
        rabDocument: ind.rabDocument ?? null,
        proposalURL: ind.proposalURL ?? null,
        rabURL: ind.rabURL ?? null,
        createdAt: ind.createdAt,
        updatedAt: ind.updatedAt,
      })) : [],
      createdBy: program.createdBy,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
    };
  }

  static toResponseList(programs: ProgramWithCategory[]): ProgramResponseDto[] {
    return programs.map((p) => ProgramMapper.toResponse(p));
  }
}
