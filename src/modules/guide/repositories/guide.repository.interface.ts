import { Guide, Prisma } from '@prisma/client';

export interface IGuideRepository {
  findAll(params: {
    skip: number;
    take: number;
    where?: Prisma.GuideWhereInput;
    orderBy?: Prisma.GuideOrderByWithRelationInput;
  }): Promise<Guide[]>;
  count(where?: Prisma.GuideWhereInput): Promise<number>;
  findById(id: string): Promise<Guide | null>;
  create(data: Prisma.GuideCreateInput): Promise<Guide>;
  update(id: string, data: Prisma.GuideUpdateInput): Promise<Guide>;
  delete(id: string): Promise<Guide>;
}
export const GUIDE_REPOSITORY = Symbol('GUIDE_REPOSITORY');
