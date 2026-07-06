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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ProgramService } from '../services/program.service';
import {
  createProgramSchema,
  CreateProgramDto,
  updateProgramSchema,
  UpdateProgramDto,
  programQuerySchema,
  ProgramResponseDto,
} from '../dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated-response.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtPayload } from '@common/guards/jwt-auth.guard';
import { Role } from '@common/constants';
import { PaginatedResponse } from '@common/dto';

@ApiTags('Programs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('programs')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  @Get()
  @ApiOperation({
    summary: 'List programs',
    description: 'Get a paginated list of programs with filtering, search, and sorting support.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'SUBMITTED', 'REVISION', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'unitId', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiPaginatedResponse(ProgramResponseDto)
  async findAll(
    @Query(new ZodValidationPipe(programQuerySchema)) query: PaginatedResponse<ProgramResponseDto>,
  ) {
    return this.programService.findAll(query as unknown as import('../dto/program-query.dto').ProgramQueryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get program by ID',
    description: 'Get a single program with its related activities, members, and approvals.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Program UUID' })
  @ApiResponse({ status: 200, description: 'Program found', type: ProgramResponseDto })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async findById(@Param('id') id: string) {
    return this.programService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.UNIT_ADMIN, Role.PIC)
  @ApiOperation({
    summary: 'Create program',
    description: 'Create a new program kerja. Requires Admin, Unit Admin, or PIC role.',
  })
  @ApiResponse({ status: 201, description: 'Program created', type: ProgramResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Program code already exists' })
  async create(
    @Body(new ZodValidationPipe(createProgramSchema)) dto: CreateProgramDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.programService.create(dto, user.userId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.UNIT_ADMIN, Role.PIC)
  @ApiOperation({
    summary: 'Update program',
    description: 'Partially update an existing program.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Program UUID' })
  @ApiResponse({ status: 200, description: 'Program updated', type: ProgramResponseDto })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProgramSchema)) dto: UpdateProgramDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.programService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.UNIT_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete program',
    description: 'Delete a program. Requires Admin or Unit Admin role.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Program UUID' })
  @ApiResponse({ status: 200, description: 'Program deleted' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async remove(@Param('id') id: string) {
    await this.programService.remove(id);
    return { message: 'Program deleted successfully' };
  }
}
