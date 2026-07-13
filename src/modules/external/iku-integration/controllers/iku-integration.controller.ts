import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { IkuIntegrationService } from '../services/iku-integration.service';
import { IkuDto } from '../dto/iku-integration.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Request } from 'express';

@ApiTags('IKU Integration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('iku')
export class IkuIntegrationController {
  constructor(private readonly ikuService: IkuIntegrationService) {}

  @Get('list')
  @ApiOperation({ summary: 'Get all IKUs from SIM IKU Service' })
  @ApiResponse({ status: 200, type: [IkuDto] })
  async getIkus(@Req() req: Request) {
    const token = req.headers.authorization;
    return this.ikuService.getAllIkus(token);
  }
}
