import {
  Controller, Get, Post, Param, UseGuards, UseInterceptors,
  UploadedFile, ParseFilePipe, MaxFileSizeValidator, ParseEnumPipe, Res,
} from '@nestjs/common';
import 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiConsumes, ApiBody, ApiProduces } from '@nestjs/swagger';
import { TemplateType } from '@prisma/client';
import { TemplateService } from '../services/template.service';
import { TemplateResponseDto } from '../dto/template.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.constant';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtPayload } from '@common/guards';
import { getAppConfig } from '@common/config';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  @ApiOperation({ summary: 'List current document templates (TOR, RAB)' })
  @ApiResponse({ status: 200, type: [TemplateResponseDto] })
  async findAll() {
    return this.templateService.findAll();
  }

  @Post(':type')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload or replace the template file for a type (ADMIN only)' })
  @ApiParam({ name: 'type', enum: TemplateType, description: 'Template type' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'The template file to upload' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Template uploaded/replaced', type: TemplateResponseDto })
  async upload(
    @Param('type', new ParseEnumPipe(TemplateType)) type: TemplateType,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: getAppConfig().MAX_FILE_SIZE })],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.templateService.upload(type, file, user.userId);
  }

  @Get(':type/download')
  @ApiOperation({
    summary: 'Download a document template (TOR or RAB)',
    description: 'Downloads the current template file for the given type, as stored in the database.',
  })
  @ApiParam({ name: 'type', enum: TemplateType, description: 'Template type to download' })
  @ApiProduces('application/octet-stream')
  @ApiResponse({ status: 200, description: 'Template file downloaded' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async download(
    @Param('type', new ParseEnumPipe(TemplateType)) type: TemplateType,
    @Res() res: Response,
  ) {
    const { buffer, fileName, mimeType } = await this.templateService.download(type);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(buffer);
  }
}
