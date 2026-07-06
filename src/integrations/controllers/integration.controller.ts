import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { IntegrationService } from '../services/integration.service';
import { PrismaService } from '@database/prisma/prisma.service';
import { outputsQuerySchema, OutputsQueryDto, IntegrationProgramDto, IntegrationOutputDto, IntegrationProgressDto, ProgramOutputsDto } from '../dto/integration.dto';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';

@ApiTags('Integration')
@Controller('integration')
export class IntegrationController {
  constructor(
    private readonly integrationService: IntegrationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('programs')
  @ApiOperation({ summary: 'List programs for integration', description: 'Returns all programs for SIM IKU consumption.' })
  @ApiResponse({ status: 200, type: [IntegrationProgramDto] })
  async getPrograms() {
    return this.integrationService.getPrograms(this.prisma);
  }

  @Get('programs/:id')
  @ApiOperation({ summary: 'Get program by ID for integration' })
  @ApiParam({ name: 'id', description: 'Program UUID' })
  @ApiResponse({ status: 200, type: IntegrationProgramDto })
  async getProgramById(@Param('id') id: string) {
    return this.integrationService.getProgramById(this.prisma, id);
  }

  @Get('programs/:id/outputs')
  @ApiOperation({ summary: 'Get program outputs for integration' })
  @ApiParam({ name: 'id', description: 'Program UUID' })
  @ApiResponse({ status: 200, type: [IntegrationOutputDto] })
  async getProgramOutputs(@Param('id') programId: string) {
    return this.integrationService.getProgramOutputs(this.prisma, programId);
  }

  @Get('programs/:id/progress')
  @ApiOperation({ summary: 'Get program progress for integration' })
  @ApiParam({ name: 'id', description: 'Program UUID' })
  @ApiResponse({ status: 200, type: [IntegrationProgressDto] })
  async getProgramProgress(@Param('id') programId: string) {
    return this.integrationService.getProgramProgress(this.prisma, programId);
  }

  @Post('outputs/query')
  @ApiOperation({ summary: 'Batch query outputs by program IDs', description: 'Returns outputs grouped by programId for SIM IKU.' })
  @ApiResponse({ status: 200, type: [ProgramOutputsDto] })
  async queryOutputs(@Body(new ZodValidationPipe(outputsQuerySchema)) dto: OutputsQueryDto) {
    return this.integrationService.queryOutputsByProgramIds(this.prisma, dto.programIds);
  }
}
