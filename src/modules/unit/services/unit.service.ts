import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@database/prisma/prisma.service';
import { catchError, firstValueFrom } from 'rxjs';
import { getAppConfig } from '@common/config';
import { CreateUnitDto, UpdateUnitDto, AssignUnitPayloadDto } from '../dto/unit.dto';
import { PaginatedResponse, PaginationMeta } from '@common/dto/pagination.dto';

@Injectable()
export class UnitService {
  private readonly logger = new Logger(UnitService.name);
  private readonly authUrl = getAppConfig().AUTH_SERVICE_URL;
  private readonly ikuUrl = getAppConfig().IKU_SERVICE_URL;

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) { }

  async getUnits(token: string, query?: any): Promise<PaginatedResponse<any>> {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.authUrl}/api/units`, {
        headers: { Authorization: token },
        params: query,
      }).pipe(
        catchError((error) => {
          this.logger.error(`Failed to fetch units: ${error.message}`);
          throw new HttpException(
            error.response?.data?.message || 'Failed to fetch units',
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );

    const items = data.data || data;

    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 10;
    const totalItems = 0 // in auth service not return total items;
    const totalPages = Math.ceil(totalItems / limit) || 0;

    const pagination: PaginationMeta = {
      page,
      limit,
      totalItems,
      totalPages
    };

    return {
      items,
      pagination
    };
  }

  async getUnitById(id: string, token: string) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.authUrl}/api/units/${id}`, {
        headers: { Authorization: token },
      }).pipe(
        catchError((error) => {
          this.logger.error(`Failed to fetch unit ${id}: ${error.message}`);
          throw new HttpException(
            error.response?.data?.message || 'Failed to fetch unit',
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
    return data.data || data;
  }

  async createUnit(payload: CreateUnitDto, token: string) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authUrl}/api/units`, payload, {
        headers: { Authorization: token },
      }).pipe(
        catchError((error) => {
          this.logger.error(`Failed to create unit: ${error.message}`);
          throw new HttpException(
            error.response?.data?.message || 'Failed to create unit',
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
    return data.data || data;
  }

  async updateUnit(id: string, payload: UpdateUnitDto, token: string) {
    const { data } = await firstValueFrom(
      this.httpService.put(`${this.authUrl}/api/units/${id}`, payload, {
        headers: { Authorization: token },
      }).pipe(
        catchError((error) => {
          this.logger.error(`Failed to update unit ${id}: ${error.message}`);
          throw new HttpException(
            error.response?.data?.message || 'Failed to update unit',
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
    return data.data || data;
  }

  async deleteUnit(id: string, token: string) {
    const { data } = await firstValueFrom(
      this.httpService.delete(`${this.authUrl}/api/units/${id}`, {
        headers: { Authorization: token },
      }).pipe(
        catchError((error) => {
          this.logger.error(`Failed to delete unit ${id}: ${error.message}`);
          throw new HttpException(
            error.response?.data?.message || 'Failed to delete unit',
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
    return data.data || data;
  }

  async assignUsers(id: string, payload: AssignUnitPayloadDto, token: string) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authUrl}/api/units/${id}/assign`, payload, {
        headers: { Authorization: token },
      }).pipe(
        catchError((error) => {
          this.logger.error(`Failed to assign users to unit ${id}: ${error.message}`);
          throw new HttpException(
            error.response?.data?.message || 'Failed to assign users to unit',
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
    return data.data || data;
  }

  async getUnitUsers(id: string, token: string, query?: any): Promise<PaginatedResponse<any>> {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.authUrl}/api/units/${id}/users`, {
        headers: { Authorization: token },
        params: query,
      }).pipe(
        catchError((error) => {
          this.logger.error(`Failed to fetch unit users ${id}: ${error.message}`);
          throw new HttpException(
            error.response?.data?.message || 'Failed to fetch unit users',
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
    
    const items = data.data || data;
    const authPagination = data.pagination;

    // Construct pagination manually
    const page = Number(query?.page) || (authPagination ? authPagination.page : 1);
    const limit = Number(query?.limit) || (authPagination ? authPagination.limit : 10);
    const totalItems = authPagination?.total ?? (Array.isArray(items) ? items.length : 0);
    const totalPages = authPagination?.totalPages ?? (Math.ceil(totalItems / limit) || 0);

    const pagination: PaginationMeta = {
      page,
      limit,
      totalItems,
      totalPages
    };

    return {
      items,
      pagination
    };
  }

  async getUnitIkus(id: string, token: string) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.ikuUrl}/api/units/${id}/ikus`, {
        headers: { Authorization: token },
      }).pipe(
        catchError((error) => {
          this.logger.error(`Failed to fetch unit ikus ${id}: ${error.message}`);
          throw new HttpException(
            error.response?.data?.message || 'Failed to fetch unit ikus',
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
    return data.data || data;
  }

  async getUserUnits(userId: string, token: string): Promise<any[]> {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.authUrl}/api/users/${userId}/units`, {
        headers: { Authorization: token },
      }).pipe(
        catchError((error) => {
          this.logger.error(`Failed to fetch units for user ${userId}: ${error.message}`);
          throw new HttpException(
            error.response?.data?.message || 'Failed to fetch user units',
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
    const units = data.data || data;
    return Array.isArray(units) ? units : [];
  }

  async getUnitDetails(id: string, token: string) {
    const [unit, usersResponse, ikuResponse] = await Promise.all([
      this.getUnitById(id, token),
      this.getUnitUsers(id, token, { limit: 100 }), // Get up to 100 users for details
      this.getUnitIkus(id, token).catch(() => ({ ikus: [] })), // Graceful fallback
    ]);

    const ikus = ikuResponse?.ikus || [];
    const users = usersResponse?.items || [];

    // Get all default programs for the IKUs
    const ikuIds = ikus.map((i: any) => i.ikuId);
    let defaultProgramsByIku: Record<string, any[]> = {};

    if (ikuIds.length > 0) {
      const defaultPrograms = await this.prisma.defaultProgram.findMany({
        where: {
          ikuId: { in: ikuIds }
        },
        include: {
          indicators: true
        }
      });

      defaultProgramsByIku = defaultPrograms.reduce((acc, dp) => {
        if (!acc[dp.ikuId]) acc[dp.ikuId] = [];
        acc[dp.ikuId].push(dp);
        return acc;
      }, {} as Record<string, any[]>);
    }

    // Attach default programs to IKUs
    const ikusWithDefaultPrograms = ikus.map((i: any) => ({
      ...i,
      defaultPrograms: defaultProgramsByIku[i.ikuId] || []
    }));

    return {
      unit,
      users,
      ikus: ikusWithDefaultPrograms,
    };
  }

  async getUnitPrograms(unitId: string, year: number) {
    const indicators = await this.prisma.programIndicator.findMany({
      where: {
        unitId: unitId,
        program: {
          year: year,
        }
      },
      include: {
        program: true,
        realizations: {
          orderBy: { month: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });

    const programMap = new Map<string, any>();

    for (const indicator of indicators) {
      const program = indicator.program;
      if (!programMap.has(program.id)) {
        programMap.set(program.id, {
          program: {
            id: program.id,
            code: program.code,
            title: program.title,
            description: program.description,
            objective: program.objective,
            year: program.year,
            createdBy: program.createdBy,
            createdAt: program.createdAt,
            updatedAt: program.updatedAt,
          },
          indikator: [],
        });
      }

      programMap.get(program.id)!.indikator.push({
        id: indicator.id,
        name: indicator.name,
        unit: indicator.unit,
        targetQ1: indicator.targetQ1 ? Number(indicator.targetQ1) : null,
        targetQ2: indicator.targetQ2 ? Number(indicator.targetQ2) : null,
        targetQ3: indicator.targetQ3 ? Number(indicator.targetQ3) : null,
        targetQ4: indicator.targetQ4 ? Number(indicator.targetQ4) : null,
        status: indicator.status,
        order: indicator.order,
        realizations: indicator.realizations.map((r) => ({
          id: r.id,
          month: r.month,
          realization: Number(r.realization),
          remark: r.remark,
        })),
      });
    }

    return Array.from(programMap.values());
  }
}

