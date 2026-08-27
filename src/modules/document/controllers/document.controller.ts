import {
  Controller, Get, Post, Delete, Param, UseGuards, UseInterceptors,
  UploadedFile, HttpCode, HttpStatus, ParseFilePipe, MaxFileSizeValidator,
  Body, ParseEnumPipe
} from '@nestjs/common';
import 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DocumentService } from '../services/document.service';
import { DocumentResponseDto } from '../dto/document.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated-response.decorator';
import { JwtPayload } from '@common/guards';
import { getAppConfig } from '@common/config';
import { DocumentType } from '@prisma/client';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get('activities/:id/documents')
  @ApiOperation({ summary: 'List documents for an activity' })
  @ApiParam({ name: 'id', description: 'Activity UUID', type: 'string' })
  @ApiPaginatedResponse(DocumentResponseDto)
  async findByActivity(@Param('id') activityId: string) {
    return this.documentService.findByActivityId(activityId);
  }

  @Post('activities/:id/documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload document file for an activity' })
  @ApiParam({ name: 'id', description: 'Activity UUID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'The file to upload (max 10MB)' },
        type: { type: 'string', enum: ['EVIDENCE', 'RAB', 'PROPOSAL', 'OTHER'], description: 'Type of document' },
      },
      required: ['file', 'type'],
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded', type: DocumentResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed or file too large' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async upload(
    @Param('id') activityId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: getAppConfig().MAX_FILE_SIZE })],
      }),
    )
    file: Express.Multer.File,
    @Body('type', new ParseEnumPipe(DocumentType)) type: DocumentType,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documentService.upload(activityId, file, type, user.userId);
  }

  @Post('documents/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document file without attaching it to an activity (universal upload)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'The file to upload (max 10MB)' },
        type: { type: 'string', enum: ['EVIDENCE', 'RAB', 'PROPOSAL', 'OTHER'], description: 'Type of document' },
      },
      required: ['file', 'type'],
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded', type: DocumentResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed or file too large' })
  async uploadUniversal(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: getAppConfig().MAX_FILE_SIZE })],
      }),
    )
    file: Express.Multer.File,
    @Body('type', new ParseEnumPipe(DocumentType)) type: DocumentType,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.documentService.uploadUniversal(file, type, user.userId);
  }

  @Delete('documents/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete document' })
  @ApiParam({ name: 'id', description: 'Document UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async remove(@Param('id') id: string) {
    await this.documentService.remove(id);
    return { message: 'Document deleted successfully' };
  }
}
