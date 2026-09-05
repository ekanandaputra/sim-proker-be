import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiProduces,
} from '@nestjs/swagger';
import { GuideService } from '../services/guide.service';
import {
  createGuideSchema,
  updateGuideSchema,
  guideQuerySchema,
  GuideResponseDto,
  GuideQueryDto,
  CreateGuideBodyDto,
  UpdateGuideBodyDto,
} from '../dto/guide.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtPayload } from '@common/guards';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated-response.decorator';
import { getAppConfig } from '@common/config';

@ApiTags('Guides')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('guides')
export class GuideController {
  constructor(private readonly guideService: GuideService) {}

  @Get()
  @ApiOperation({ summary: 'List guides' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by title or description',
  })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiPaginatedResponse(GuideResponseDto)
  async findAll(@Query(new ZodValidationPipe(guideQuerySchema)) query: GuideQueryDto) {
    return this.guideService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a guide by ID' })
  @ApiParam({ name: 'id', description: 'Guide UUID' })
  @ApiResponse({ status: 200, type: GuideResponseDto })
  @ApiResponse({ status: 404, description: 'Guide not found' })
  async findById(@Param('id') id: string) {
    return this.guideService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create a new guide (ADMIN only)',
    description:
      'Upload guide material (file) and/or a video link (Google Drive or YouTube). At least one of them is required.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the guide' },
        description: { type: 'string', description: 'Description of the guide' },
        videoUrl: { type: 'string', description: 'Google Drive or YouTube video link' },
        file: { type: 'string', format: 'binary', description: 'Guide material file (optional)' },
      },
      required: ['title'],
    },
  })
  @ApiResponse({ status: 201, description: 'Guide created', type: GuideResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Validation failed, or neither file nor video URL provided',
  })
  async create(
    @Body(new ZodValidationPipe(createGuideSchema)) dto: CreateGuideBodyDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [new MaxFileSizeValidator({ maxSize: getAppConfig().MAX_FILE_SIZE })],
      }),
    )
    file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.guideService.create(dto, file, user.userId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a guide (ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Guide UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        videoUrl: {
          type: 'string',
          description: 'Google Drive or YouTube video link (send an empty string to remove it)',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'Replacement guide material file (optional)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Guide updated', type: GuideResponseDto })
  @ApiResponse({ status: 404, description: 'Guide not found' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateGuideSchema)) dto: UpdateGuideBodyDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [new MaxFileSizeValidator({ maxSize: getAppConfig().MAX_FILE_SIZE })],
      }),
    )
    file: Express.Multer.File | undefined,
  ) {
    return this.guideService.update(id, dto, file);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a guide (ADMIN only)' })
  @ApiParam({ name: 'id', description: 'Guide UUID' })
  @ApiResponse({ status: 200, description: 'Guide deleted successfully' })
  @ApiResponse({ status: 404, description: 'Guide not found' })
  async remove(@Param('id') id: string) {
    await this.guideService.remove(id);
    return { message: 'Guide deleted successfully' };
  }

  @Get(':id/download')
  @ApiOperation({
    summary: 'Download the guide material file',
    description: 'Downloads the uploaded material file for the given guide, if one exists.',
  })
  @ApiParam({ name: 'id', description: 'Guide UUID' })
  @ApiProduces('application/octet-stream')
  @ApiResponse({ status: 200, description: 'File downloaded' })
  @ApiResponse({ status: 404, description: 'Guide or file not found' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const { buffer, fileName, mimeType } = await this.guideService.download(id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(buffer);
  }
}
