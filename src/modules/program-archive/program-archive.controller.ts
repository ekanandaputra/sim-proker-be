import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ProgramArchiveService } from './program-archive.service';
import {
  CreateProgramArchiveDto,
  UpdateProgramArchiveDto,
  ProgramArchiveResponseDto,
  CreateProgramArchiveBodyDto,
  UpdateProgramArchiveBodyDto,
  createProgramArchiveSchema,
  updateProgramArchiveSchema,
} from './dto/program-archive.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants';
import { ApiMessageResponse } from '@common/decorators/api-response-schema.decorator';

@ApiTags('Program Archives')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('program-archives')
export class ProgramArchiveController {
  constructor(private readonly programArchiveService: ProgramArchiveService) {}

  @Get()
  @ApiOperation({ summary: 'List arsip proker (tahun & link Google Drive), urut tahun terbaru' })
  @ApiResponse({ status: 200, type: ProgramArchiveResponseDto, isArray: true })
  async findAll() {
    return this.programArchiveService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get arsip proker by ID' })
  @ApiParam({ name: 'id', description: 'Archive UUID' })
  @ApiResponse({ status: 200, type: ProgramArchiveResponseDto })
  @ApiResponse({ status: 404, description: 'Program archive not found' })
  async findById(@Param('id') id: string) {
    return this.programArchiveService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create arsip proker (ADMIN only)' })
  @ApiBody({ type: CreateProgramArchiveDto })
  @ApiResponse({ status: 201, type: ProgramArchiveResponseDto })
  @ApiResponse({ status: 409, description: 'Archive for the year already exists' })
  async create(
    @Body(new ZodValidationPipe(createProgramArchiveSchema)) dto: CreateProgramArchiveBodyDto,
  ) {
    return this.programArchiveService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update tahun / link Google Drive arsip proker (ADMIN only)' })
  @ApiBody({ type: UpdateProgramArchiveDto })
  @ApiParam({ name: 'id', description: 'Archive UUID' })
  @ApiResponse({ status: 200, type: ProgramArchiveResponseDto })
  @ApiResponse({ status: 404, description: 'Program archive not found' })
  @ApiResponse({ status: 409, description: 'Archive for the year already exists' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProgramArchiveSchema)) dto: UpdateProgramArchiveBodyDto,
  ) {
    return this.programArchiveService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete arsip proker (ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Archive UUID' })
  @ApiMessageResponse('Program archive deleted successfully')
  @ApiResponse({ status: 404, description: 'Program archive not found' })
  async remove(@Param('id') id: string) {
    await this.programArchiveService.remove(id);
    return { message: 'Program archive deleted successfully' };
  }
}
