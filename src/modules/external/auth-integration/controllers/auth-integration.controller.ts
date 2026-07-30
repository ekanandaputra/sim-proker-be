import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthIntegrationService } from '../services/auth-integration.service';
import { AuthUserDto, AuthUnitDto } from '../dto/auth-integration.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Request } from 'express';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated-response.decorator';
import { paginationQuerySchema, PaginationQuery } from '@common/dto/pagination.dto';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';

@ApiTags('Auth Integration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('auth')
export class AuthIntegrationController {
  constructor(private readonly authService: AuthIntegrationService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get all users from Auth Service' })
  @ApiPaginatedResponse(AuthUserDto)
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search keyword' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order (asc/desc)' })
  async getUsers(
    @Req() req: Request,
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery,
  ) {
    const token = req.headers.authorization;
    return this.authService.getAllUsers(token, query);
  }

  @Get('units')
  @ApiOperation({ summary: 'Get all units from Auth Service' })
  @ApiResponse({ status: 200, type: [AuthUnitDto] })
  async getUnits(@Req() req: Request) {
    const token = req.headers.authorization;
    return this.authService.getAllUnits(token);
  }
}
