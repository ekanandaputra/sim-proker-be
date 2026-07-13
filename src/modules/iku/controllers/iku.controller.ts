import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search keyword' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order (asc/desc)' })
  async getAllIkus(
    @Req() req: Request,
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery,
  ) {
    const token = req.headers.authorization;
    return this.ikuService.getAllIkus(token, query);
  }
}
