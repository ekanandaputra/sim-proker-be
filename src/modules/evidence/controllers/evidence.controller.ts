import {
  Controller, Get, Post, Delete, Param, UseGuards, UseInterceptors,
  UploadedFile, HttpCode, HttpStatus, ParseFilePipe, MaxFileSizeValidator,
} from '@nestjs/common';
import 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { EvidenceService } from '../services/evidence.service';
import { EvidenceResponseDto } from '../dto/evidence.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { JwtPayload } from '@common/guards';
import { getAppConfig } from '@common/config';

@ApiTags('Evidences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Get('activities/:id/evidences')
  @ApiOperation({ summary: 'List evidences for an activity' })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiResponse({ status: 200, type: [EvidenceResponseDto] })
  async findByActivity(@Param('id') activityId: string) {
    return this.evidenceService.findByActivityId(activityId);
  }

  @Post('activities/:id/evidences')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload evidence file for an activity' })
  @ApiParam({ name: 'id', description: 'Activity UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'The file to upload' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, type: EvidenceResponseDto })
  async upload(
    @Param('id') activityId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: getAppConfig().MAX_FILE_SIZE })],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.evidenceService.upload(activityId, file, user.userId);
  }

  @Delete('evidences/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete evidence' })
  @ApiParam({ name: 'id', description: 'Evidence UUID' })
  async remove(@Param('id') id: string) {
    await this.evidenceService.remove(id);
    return { message: 'Evidence deleted successfully' };
  }
}
