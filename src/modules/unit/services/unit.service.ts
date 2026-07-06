import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { getAppConfig } from '@common/config';

@Injectable()
export class UnitService {
  private readonly logger = new Logger(UnitService.name);
  private readonly authUrl = getAppConfig().AUTH_SERVICE_URL;

  constructor(private readonly httpService: HttpService) {}

  async getUnits(token: string, query?: any) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.authUrl}/api/v1/units`, {
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
    return data;
  }

  async getUnitById(id: string, token: string) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.authUrl}/api/v1/units/${id}`, {
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
    return data;
  }

  async createUnit(payload: any, token: string) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.authUrl}/api/v1/units`, payload, {
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
    return data;
  }

  async updateUnit(id: string, payload: any, token: string) {
    const { data } = await firstValueFrom(
      this.httpService.put(`${this.authUrl}/api/v1/units/${id}`, payload, {
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
    return data;
  }

  async deleteUnit(id: string, token: string) {
    const { data } = await firstValueFrom(
      this.httpService.delete(`${this.authUrl}/api/v1/units/${id}`, {
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
    return data;
  }
}
