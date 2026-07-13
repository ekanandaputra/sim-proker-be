import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IkuService } from '../services/iku.service';
import { IkuResponseDto } from '../dto/iku.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Request } from 'express';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated-response.decorator';
import { paginationQuerySchema, PaginationQuery } from '@common/dto/pagination.dto';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';

@ApiTags('IKU')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ikus')
export class IkuController {
  constructor(private readonly ikuService: IkuService) {}

  @Get()
  @ApiOperation({ summary: 'Get all IKUs' })
  @ApiPaginatedResponse(IkuResponseDto)
  async getAllIkus(
    @Req() req: Request,
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery,
  ) {
    const token = req.headers.authorization;
    return this.ikuService.getAllIkus(token, query);
  }
}
