import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { getAppConfig } from '@common/config';
import { CreateUnitDto, UpdateUnitDto } from '../dto/unit.dto';
import { PaginatedResponse, PaginationMeta } from '@common/dto/pagination.dto';

@Injectable()
export class UnitService {
  private readonly logger = new Logger(UnitService.name);
  private readonly authUrl = getAppConfig().AUTH_SERVICE_URL;

  constructor(private readonly httpService: HttpService) { }

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
}
