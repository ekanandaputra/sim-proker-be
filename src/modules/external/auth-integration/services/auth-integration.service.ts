import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { getAppConfig } from '@common/config';
import { AuthUserDto, AuthUnitDto } from '../dto/auth-integration.dto';

@Injectable()
export class AuthIntegrationService {
  private readonly logger = new Logger(AuthIntegrationService.name);
  private readonly authUrl = getAppConfig().AUTH_SERVICE_URL;

  constructor(private readonly httpService: HttpService) { }

  async getAllUsers(token?: string): Promise<AuthUserDto[]> {
    const headers: Record<string, string> = {
      'x-service-name': 'sim-iku',
      ...(token && { Authorization: token }),
    };

    const { data } = await firstValueFrom(
      this.httpService.get<{ data: AuthUserDto[] }>(`${this.authUrl}/api/users`, { headers }).pipe(
        catchError((error) => {
          this.logger.error(`Failed to fetch users from Auth Service: ${error.message}`);
          throw new HttpException(
            'Failed to retrieve users from Auth Service',
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );

    // Assuming Auth Service wraps response in standard `{ isSuccess, data, ... }` format
    return data.data || (data as any);
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
