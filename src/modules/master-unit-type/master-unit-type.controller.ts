import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse, ApiProduces, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MasterUnitTypeService } from './master-unit-type.service';
import { 
  CreateMasterUnitTypeDto, 
  UpdateMasterUnitTypeDto, 
  MasterUnitTypeDto,
  createMasterUnitTypeSchema,
  updateMasterUnitTypeSchema
} from './dto/master-unit-type.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated-response.decorator';
import { paginationQuerySchema, PaginationQuery } from '@common/dto/pagination.dto';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';

@ApiTags('Master Unit Type')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('master-unit-types')
export class MasterUnitTypeController {
  constructor(private readonly masterUnitTypeService: MasterUnitTypeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all master unit types' })
  @ApiPaginatedResponse(MasterUnitTypeDto)
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page (default: 10)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search keyword' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order (asc/desc)' })
  async findAll(
    @Query(new ZodValidationPipe(paginationQuerySchema)) query: PaginationQuery,
  ) {
    return this.masterUnitTypeService.findAll(query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export master unit types to Excel' })
  @ApiProduces('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @ApiResponse({
    status: 200,
    description: 'Excel file downloaded',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportExcel(@Res() res: Response) {
    const buffer = await this.masterUnitTypeService.exportExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="master-unit-types.xlsx"');
    res.send(buffer);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import master unit types from Excel (XLSX)' })
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
  @ApiResponse({ status: 201, description: 'Excel file imported successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    return this.masterUnitTypeService.importExcel(file.buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get master unit type by ID' })
  @ApiResponse({ status: 200, type: MasterUnitTypeDto })
  async findById(@Param('id') id: string) {
    return this.masterUnitTypeService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new master unit type' })
  @ApiResponse({ status: 201, type: MasterUnitTypeDto })
  async create(
    @Body(new ZodValidationPipe(createMasterUnitTypeSchema)) dto: CreateMasterUnitTypeDto,
  ) {
    return this.masterUnitTypeService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update master unit type' })
  @ApiResponse({ status: 200, type: MasterUnitTypeDto })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMasterUnitTypeSchema)) dto: UpdateMasterUnitTypeDto,
  ) {
    return this.masterUnitTypeService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete master unit type' })
  @ApiResponse({ status: 200, description: 'Master unit type successfully deleted' })
  async remove(@Param('id') id: string) {
    return this.masterUnitTypeService.remove(id);
  }
}
