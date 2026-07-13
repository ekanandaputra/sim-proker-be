import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DefaultProgramService } from '../services/default-program.service';
import { CreateDefaultProgramDto, UpdateDefaultProgramDto, DefaultProgramDto, createDefaultProgramSchema, updateDefaultProgramSchema } from '../dto/default-program.dto';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';

@ApiTags('Default Program')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('default-programs')
export class DefaultProgramController {
  constructor(private readonly defaultProgramService: DefaultProgramService) {}

  @Get()
  @ApiOperation({ summary: 'Get all default programs' })
  @ApiResponse({ status: 200, type: [DefaultProgramDto] })
  async findAll() {
    return this.defaultProgramService.findAll();
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
