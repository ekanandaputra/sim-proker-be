import { Injectable, Logger } from '@nestjs/common';
import { IkuIntegrationService } from '@modules/external/iku-integration/services/iku-integration.service';
import { IkuResponseDto } from '../dto/iku.dto';
import { PaginatedResponse } from '@common/dto/pagination.dto';

@Injectable()
export class IkuService {
  private readonly logger = new Logger(IkuService.name);

  constructor(private readonly ikuIntegrationService: IkuIntegrationService) {}

  async getAllIkus(token?: string, query?: any): Promise<PaginatedResponse<IkuResponseDto>> {
    this.logger.log('Fetching IKUs from integration service');
    return this.ikuIntegrationService.getAllIkus(token, query);
  }
}
