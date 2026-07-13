import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { getAppConfig } from '@common/config';
import { IkuDto } from '../dto/iku-integration.dto';

interface IkuApiResponse {
  success: boolean;
  data: {
    data: IkuDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

@Injectable()
export class IkuIntegrationService {
  private readonly logger = new Logger(IkuIntegrationService.name);
  private readonly ikuUrl = getAppConfig().IKU_SERVICE_URL;

  constructor(private readonly httpService: HttpService) {}

  async getAllIkus(token?: string): Promise<IkuDto[]> {
    const headers = token ? { Authorization: token } : undefined;

    const { data } = await firstValueFrom(
      this.httpService.get<IkuApiResponse>(`${this.ikuUrl}/api/ikus`, { headers }).pipe(
        catchError((error) => {
          this.logger.error(`Failed to fetch IKUs from IKU Service: ${error.message}`);
          throw new HttpException(
            'Failed to retrieve IKUs from IKU Service',
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );

    // sim-iku-api wraps response as { success, data: { data: [...], pagination } }
    return data?.data?.data || (data as any);
  }
}
