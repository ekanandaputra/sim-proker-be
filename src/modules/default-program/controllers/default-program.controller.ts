import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { DefaultProgramService } from '../services/default-program.service';
import { CreateDefaultProgramDto, UpdateDefaultProgramDto, DefaultProgramDto, createDefaultProgramSchema, updateDefaultProgramSchema, AssignDefaultProgramDto, assignDefaultProgramSchema, AssignDefaultProgramIndicatorDto, assignDefaultProgramIndicatorSchema } from '../dto/default-program.dto';
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

  @Get('export')
  @ApiOperation({ summary: 'Export default programs to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file downloaded' })
  async exportCsv(@Res() res: Response) {
    const csv = await this.defaultProgramService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="default-programs.csv"');
    res.send(csv);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import default programs from CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'CSV file imported successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.defaultProgramService.importCsv(file.buffer);
  }

  @Get('by-iku/:ikuId')
  @ApiOperation({ summary: 'Get default programs by IKU ID' })
  @ApiParam({ name: 'ikuId', description: 'IKU UUID', type: 'string' })
  @ApiResponse({ status: 200, type: [DefaultProgramDto] })
  async findByIkuId(@Param('ikuId') ikuId: string) {
    return this.defaultProgramService.findByIkuId(ikuId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get default program by ID' })
  @ApiParam({ name: 'id', description: 'Default Program UUID', type: 'string' })
  @ApiResponse({ status: 200, type: DefaultProgramDto })
  @ApiResponse({ status: 404, description: 'Default program not found' })
  async findById(@Param('id') id: string) {
    return this.defaultProgramService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new default program' })
  @ApiBody({ type: CreateDefaultProgramDto })
  @ApiResponse({ status: 201, type: DefaultProgramDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async create(@Body(new ZodValidationPipe(createDefaultProgramSchema)) dto: CreateDefaultProgramDto) {
    return this.defaultProgramService.create(dto);
  }

  @Post('assign-to-unit')
  @ApiOperation({ summary: 'Assign a default program to a unit for a specific period' })
  @ApiBody({ type: AssignDefaultProgramDto })
  @ApiResponse({ status: 201, description: 'Default programs assigned successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async assignToUnit(
    @Body(new ZodValidationPipe(assignDefaultProgramSchema)) dto: AssignDefaultProgramDto,
    @CurrentUser('userId') userId: string,
    @Req() req: Request,
  ) {
    const token = req.headers.authorization as string;
    return this.defaultProgramService.assignToUnit(dto, userId, token);
  }

  @Post('indicators/assign')
  @ApiOperation({ summary: 'Assign a default program indicator to a unit manually' })
  @ApiBody({ type: AssignDefaultProgramIndicatorDto })
  @ApiResponse({ status: 201, description: 'Default program indicator assigned successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async assignIndicatorToUnit(
    @Body(new ZodValidationPipe(assignDefaultProgramIndicatorSchema)) dto: AssignDefaultProgramIndicatorDto,
    @CurrentUser('userId') userId: string,
    @Req() req: Request,
  ) {
    const token = req.headers.authorization as string;
    return this.defaultProgramService.assignIndicatorToUnit(dto, userId, token);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update default program' })
  @ApiParam({ name: 'id', description: 'Default Program UUID', type: 'string' })
  @ApiBody({ type: UpdateDefaultProgramDto })
  @ApiResponse({ status: 200, type: DefaultProgramDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Default program not found' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateDefaultProgramSchema)) dto: UpdateDefaultProgramDto
  ) {
    return this.defaultProgramService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete default program' })
  @ApiParam({ name: 'id', description: 'Default Program UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Deleted successfully' })
  @ApiResponse({ status: 404, description: 'Default program not found' })
  async remove(@Param('id') id: string) {
    await this.defaultProgramService.remove(id);
    return { success: true };
  }
}
