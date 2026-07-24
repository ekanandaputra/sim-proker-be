import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { getAppConfig } from '@common/config';
import { AuthUserDto, AuthUnitDto } from '../dto/auth-integration.dto';
import { PaginatedResponse, PaginationQuery } from '@common/dto/pagination.dto';

interface AuthUsersApiResponse {
  success?: boolean;
  data: {
    data: AuthUserDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
@Injectable()
export class AuthIntegrationService {
  private readonly logger = new Logger(AuthIntegrationService.name);
  private readonly authUrl = getAppConfig().AUTH_SERVICE_URL;

  constructor(private readonly httpService: HttpService) { }

  async getAllUsers(token?: string, query?: PaginationQuery): Promise<PaginatedResponse<AuthUserDto>> {
    const headers: Record<string, string> = {
      'x-service-name': 'sim-iku',
      ...(token && { Authorization: token }),
    };

    const params = query ? { 
      page: query.page, 
      limit: query.limit,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    } : undefined;

    const { data } = await firstValueFrom(
      this.httpService.get<AuthUsersApiResponse>(`${this.authUrl}/api/users`, { headers, params }).pipe(
        catchError((error) => {
          this.logger.error(`Failed to fetch users from Auth Service: ${error.message}`);
          throw new HttpException(
            'Failed to retrieve users from Auth Service',
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );

    const resData = data?.data;
    if (!resData || !resData.data) {
      // Fallback if the response is just an array or lacks pagination metadata
      const items = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      return {
        items,
        pagination: { page: query?.page || 1, limit: query?.limit || 10, totalItems: items.length, totalPages: 1 }
      };
    }

    return {
      items: resData.data,
      pagination: {
        page: resData.pagination?.page || 1,
        limit: resData.pagination?.limit || 10,
        totalItems: resData.pagination?.total || resData.data.length,
        totalPages: resData.pagination?.totalPages || 1,
      }
    };
  }

  async getAllUnits(token?: string): Promise<AuthUnitDto[]> {
    const headers: Record<string, string> = {
      'x-service-name': 'sim-iku',
      ...(token && { Authorization: token }),
    };

    const { data } = await firstValueFrom(
      this.httpService.get<{ data: AuthUnitDto[] }>(`${this.authUrl}/api/units`, { headers }).pipe(
        catchError((error) => {
          this.logger.error(`Failed to fetch units from Auth Service: ${error.message}`);
          throw new HttpException(
            'Failed to retrieve units from Auth Service',
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );

    return data.data || (data as any);
  }
}
