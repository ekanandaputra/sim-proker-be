import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DefaultProgramService } from '../services/default-program.service';
import { CreateDefaultProgramDto, UpdateDefaultProgramDto, DefaultProgramDto, createDefaultProgramSchema, updateDefaultProgramSchema, AssignDefaultProgramDto, assignDefaultProgramSchema } from '../dto/default-program.dto';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated-response.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { paginationQuerySchema, PaginationQuery } from '@common/dto/pagination.dto';

@ApiTags('Default Program')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('default-programs')
export class DefaultProgramController {
  constructor(private readonly defaultProgramService: DefaultProgramService) {}

  @Get()
  @ApiOperation({ summary: 'Get all default programs' })
  @ApiPaginatedResponse(DefaultProgramDto)
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search keyword' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order (asc/desc)' })
  async findAll(@Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery) {
    return this.defaultProgramService.findAll(query);
  }

  @Get('by-iku/:ikuId')
  @ApiOperation({ summary: 'Get default programs by IKU ID' })
  @ApiResponse({ status: 200, type: [DefaultProgramDto] })
  async findByIkuId(@Param('ikuId') ikuId: string) {
    return this.defaultProgramService.findByIkuId(ikuId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get default program by ID' })
  @ApiResponse({ status: 200, type: DefaultProgramDto })
  async findById(@Param('id') id: string) {
    return this.defaultProgramService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new default program' })
  @ApiResponse({ status: 201, type: DefaultProgramDto })
  async create(@Body(new ZodValidationPipe(createDefaultProgramSchema)) dto: CreateDefaultProgramDto) {
    return this.defaultProgramService.create(dto);
  }

  @Post('assign-to-unit')
  @ApiOperation({ summary: 'Assign default programs to a unit for a specific year' })
  @ApiResponse({ status: 201, description: 'Default programs assigned successfully' })
  async assignToUnit(
    @Body(new ZodValidationPipe(assignDefaultProgramSchema)) dto: AssignDefaultProgramDto,
    @CurrentUser('userId') userId: string,
    @Req() req: Request,
  ) {
    const token = req.headers.authorization as string;
    return this.defaultProgramService.assignToUnit(dto, userId, token);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update default program' })
  @ApiResponse({ status: 200, type: DefaultProgramDto })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateDefaultProgramSchema)) dto: UpdateDefaultProgramDto
  ) {
    return this.defaultProgramService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete default program' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  async remove(@Param('id') id: string) {
    await this.defaultProgramService.remove(id);
    return { success: true };
  }
}
