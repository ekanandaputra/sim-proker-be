import { Program, Prisma } from '@prisma/client';

export interface IProgramRepository {
  findAll(params: {
    skip: number;
    take: number;
    where?: Prisma.ProgramWhereInput;
    orderBy?: Prisma.ProgramOrderByWithRelationInput;
    include?: Prisma.ProgramInclude;
  }): Promise<Program[]>;

  count(where?: Prisma.ProgramWhereInput): Promise<number>;

  findById(id: string, include?: Prisma.ProgramInclude): Promise<Program | null>;

  findByCode(code: string): Promise<Program | null>;

  create(data: Prisma.ProgramCreateInput): Promise<Program>;

  update(id: string, data: Prisma.ProgramUpdateInput): Promise<Program>;

  delete(id: string): Promise<Program>;
}

export const PROGRAM_REPOSITORY = Symbol('PROGRAM_REPOSITORY');
