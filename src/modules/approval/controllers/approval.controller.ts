import { Controller, Post, Get, Patch, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody, ApiQuery, ApiExtraModels } from '@nestjs/swagger';
import { ApprovalService } from '../services/approval.service';
import { approvalActionSchema, ApprovalActionDto, ApprovalResponseDto, SubmittedProgramIndicatorResponseDto, RevisionIndicatorResponseDto, RejectedIndicatorResponseDto } from '../dto/approval.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtPayload } from '@common/guards';
import { Role } from '@common/constants';
import { ApiPaginatedResponse } from '@common/decorators/api-paginated-response.decorator';
import { SetIndicatorTargetDto, setIndicatorTargetSchema, ProgramIndicatorResponseDto } from '../../program/dto/program-indicator.dto';

@ApiTags('Approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiExtraModels(ApprovalActionDto, ApprovalResponseDto, SubmittedProgramIndicatorResponseDto, RevisionIndicatorResponseDto, RejectedIndicatorResponseDto)
@Controller()
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get('indicators/submitted')
  @Roles(Role.ADMIN, Role.REVIEWER_INDIKATOR_PROKER)
  @ApiOperation({
    summary: 'List indicators pending indicator verification (Level 1)',
    description: 'Returns a paginated list of program indicators with SUBMITTED or REVISION status, waiting for indicator verification (Level 1).',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Items per page (default: 10)' })
  @ApiPaginatedResponse(SubmittedProgramIndicatorResponseDto)
  async getSubmittedIndicators(@Req() req: any, @Query() query: any) {
    const token = req.headers.authorization as string;
    const user = req.user;
    return this.approvalService.getSubmittedIndicators(token, query, user);
  }

  @Get('indicators/indicator-approved')
  @Roles(Role.ADMIN, Role.REVIEWER_ANGGARAN_PROKER)
  @ApiOperation({
    summary: 'List indicators pending budget verification (Level 2)',
    description: 'Returns a paginated list of program indicators with INDICATOR_APPROVED status, waiting for budget verification (Level 2).',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Items per page (default: 10)' })
  @ApiPaginatedResponse(SubmittedProgramIndicatorResponseDto)
  async getIndicatorApprovedIndicators(@Req() req: any, @Query() query: any) {
    const token = req.headers.authorization as string;
    const user = req.user;
    return this.approvalService.getIndicatorApprovedIndicators(token, query, user);
  }

  @Post('indicators/:id/approve')
  @Roles(Role.ADMIN, Role.REVIEWER_INDIKATOR_PROKER, Role.REVIEWER_ANGGARAN_PROKER)
  @ApiOperation({
    summary: 'Approve a program indicator',
    description:
      'Approves a program indicator. The verification level is determined automatically based on the current status:\n\n' +
      '- **SUBMITTED / REVISION** → Level 1 (Verifikasi Indikator) → status becomes `INDICATOR_APPROVED`\n' +
      '- **INDICATOR_APPROVED** → Level 2 (Verifikasi Anggaran) → status becomes `APPROVED`\n\n' +
      'Only users registered as reviewers for the corresponding level (and IKU for Level 1) can approve.',
  })
  @ApiParam({ name: 'id', description: 'Program Indicator UUID', type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({
    type: ApprovalActionDto,
    examples: {
      with_note: {
        summary: 'Approve with note',
        value: { note: 'Indikator sudah sesuai, silakan lanjut ke verifikasi anggaran' },
      },
      without_note: {
        summary: 'Approve without note',
        value: {},
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Approval successful',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: {
          properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440099' },
            indicatorId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
            status: { type: 'string', enum: ['APPROVED'], example: 'APPROVED' },
            level: { type: 'string', enum: ['INDICATOR_VERIFICATION', 'BUDGET_VERIFICATION'], example: 'INDICATOR_VERIFICATION' },
            approverId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440002' },
            note: { type: 'string', nullable: true, example: 'Indikator sudah sesuai' },
            approvedAt: { type: 'string', format: 'date-time', example: '2026-08-18T04:00:00.000Z' },
            createdAt: { type: 'string', format: 'date-time', example: '2026-08-18T04:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation or state error (e.g., indicator not in correct status)',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'ProgramIndicator can only be approved from SUBMITTED, REVISION, or INDICATOR_APPROVED status. Current: DRAFT' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'User is not authorized as a reviewer for this level/IKU',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'User user-001 is not authorized as a INDICATOR_VERIFICATION reviewer for IKU iku-001' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Program Indicator not found',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'ProgramIndicator with id 550e8400-... not found' },
      },
    },
  })
  async approve(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(approvalActionSchema)) dto: ApprovalActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.approvalService.approve(id, dto, user.userId);
  }

  @Post('indicators/:id/reject')
  @Roles(Role.ADMIN, Role.REVIEWER_INDIKATOR_PROKER, Role.REVIEWER_ANGGARAN_PROKER)
  @ApiOperation({
    summary: 'Reject a program indicator',
    description:
      'Rejects a program indicator. The verification level is determined automatically based on current status.\n\n' +
      'Rejection from any level sets the indicator status to `REJECTED`.\n\n' +
      'Only users registered as reviewers for the corresponding level can reject.',
  })
  @ApiParam({ name: 'id', description: 'Program Indicator UUID', type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({
    type: ApprovalActionDto,
    examples: {
      with_note: {
        summary: 'Reject with reason',
        value: { note: 'Indikator tidak sesuai dengan target IKU' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Rejection successful',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: {
          properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440099' },
            indicatorId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
            status: { type: 'string', enum: ['REJECTED'], example: 'REJECTED' },
            level: { type: 'string', enum: ['INDICATOR_VERIFICATION', 'BUDGET_VERIFICATION'], example: 'INDICATOR_VERIFICATION' },
            approverId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440002' },
            note: { type: 'string', nullable: true, example: 'Indikator tidak sesuai dengan target IKU' },
            approvedAt: { type: 'string', format: 'date-time', example: '2026-08-18T04:00:00.000Z' },
            createdAt: { type: 'string', format: 'date-time', example: '2026-08-18T04:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation or state error',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'ProgramIndicator can only be rejected from SUBMITTED, REVISION, or INDICATOR_APPROVED status. Current: DRAFT' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'User is not authorized as a reviewer for this level/IKU',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'User user-001 is not authorized as a INDICATOR_VERIFICATION reviewer for IKU iku-001' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Program Indicator not found',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'ProgramIndicator with id 550e8400-... not found' },
      },
    },
  })
  async reject(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(approvalActionSchema)) dto: ApprovalActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.approvalService.reject(id, dto, user.userId);
  }

  @Post('indicators/:id/revision')
  @Roles(Role.ADMIN, Role.REVIEWER_INDIKATOR_PROKER, Role.REVIEWER_ANGGARAN_PROKER)
  @ApiOperation({
    summary: 'Request revision for a program indicator',
    description:
      'Requests a revision for a program indicator. The verification level is determined automatically.\n\n' +
      'Revision request from any level sets the indicator status back to `REVISION`. ' +
      'The indicator must be re-submitted and go through Level 1 again.\n\n' +
      'Only users registered as reviewers for the corresponding level can request revision.',
  })
  @ApiParam({ name: 'id', description: 'Program Indicator UUID', type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({
    type: ApprovalActionDto,
    examples: {
      with_note: {
        summary: 'Request revision with feedback',
        value: { note: 'Silakan perbaiki anggaran pada bagian operasional' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Revision requested successfully',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: {
          properties: {
            id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440099' },
            indicatorId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
            status: { type: 'string', enum: ['REVISION'], example: 'REVISION' },
            level: { type: 'string', enum: ['INDICATOR_VERIFICATION', 'BUDGET_VERIFICATION'], example: 'BUDGET_VERIFICATION' },
            approverId: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440002' },
            note: { type: 'string', nullable: true, example: 'Silakan perbaiki anggaran pada bagian operasional' },
            approvedAt: { type: 'string', format: 'date-time', nullable: true, example: null },
            createdAt: { type: 'string', format: 'date-time', example: '2026-08-18T04:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation or state error',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Revision can only be requested from SUBMITTED or INDICATOR_APPROVED status. Current: DRAFT' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'User is not authorized as a reviewer for this level/IKU',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'User user-001 is not authorized as a BUDGET_VERIFICATION reviewer' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Program Indicator not found',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'ProgramIndicator with id 550e8400-... not found' },
      },
    },
  })
  async revision(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(approvalActionSchema)) dto: ApprovalActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.approvalService.requestRevision(id, dto, user.userId);
  }

  @Get('indicators/revision')
  @ApiOperation({
    summary: 'Get the revision bucket for the current user',
    description:
      'Returns a paginated list of program indicators with `REVISION` status that are assigned to the current ' +
      "user's own unit(s). ADMIN users see indicators across all units.\n\n" +
      'Each item includes the note and level (`INDICATOR_VERIFICATION` or `BUDGET_VERIFICATION`) from the ' +
      'reviewer who requested the revision, so the unit knows what to fix.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Items per page (default: 10)' })
  @ApiPaginatedResponse(RevisionIndicatorResponseDto)
  async getRevisionIndicators(@Req() req: Request, @Query() query: any, @CurrentUser() user: JwtPayload) {
    const token = req.headers.authorization as string;
    return this.approvalService.getRevisionIndicators(token, query, user);
  }

  @Post('indicators/:id/revise')
  @ApiOperation({
    summary: 'Revise an indicator and resubmit it',
    description:
      'Updates the indicator targets/documents (same payload as `set-target`) and reverts its status back to ' +
      'whatever it was before the revision was requested: `SUBMITTED` if the revision came from Level 1 ' +
      '(Verifikasi Indikator), or `INDICATOR_APPROVED` if it came from Level 2 (Verifikasi Anggaran).\n\n' +
      'The indicator must currently be in `REVISION` status, and must be assigned to a unit the current user ' +
      'belongs to (unless the user is ADMIN).',
  })
  @ApiParam({ name: 'id', description: 'Program Indicator UUID', type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiBody({ type: SetIndicatorTargetDto })
  @ApiResponse({ status: 200, type: ProgramIndicatorResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Indicator is not in REVISION status',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Indicator can only be revised from REVISION status. Current: SUBMITTED' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Indicator is not assigned to the current user's unit",
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'You are not allowed to revise an indicator outside your unit' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Program Indicator not found',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: false },
        message: { type: 'string', example: 'ProgramIndicator with id 550e8400-... not found' },
      },
    },
  })
  async reviseIndicator(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setIndicatorTargetSchema)) dto: SetIndicatorTargetDto,
    @Req() req: Request,
    @CurrentUser() user: JwtPayload,
  ) {
    const token = req.headers.authorization as string;
    return this.approvalService.revise(id, dto, user, token);
  }

  @Get('indicators/rejected')
  @ApiOperation({
    summary: 'Get the rejected indicators list for the current user',
    description:
      'Returns a paginated, read-only list of program indicators with `REJECTED` status that are assigned to ' +
      "the current user's own unit(s). ADMIN users see indicators across all units.\n\n" +
      'Each item includes the note and level (`INDICATOR_VERIFICATION` or `BUDGET_VERIFICATION`) from the ' +
      'reviewer who rejected it. This list is informational only — no action can be taken on a rejected indicator here.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Items per page (default: 10)' })
  @ApiPaginatedResponse(RejectedIndicatorResponseDto)
  async getRejectedIndicators(@Req() req: Request, @Query() query: any, @CurrentUser() user: JwtPayload) {
    const token = req.headers.authorization as string;
    return this.approvalService.getRejectedIndicators(token, query, user);
  }

  @Patch('indicators/change-to-in-progress/:year')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Ubah semua indikator APPROVED menjadi IN_PROGRESS pada tahun tertentu',
    description:
      'Mengubah status semua `ProgramIndicator` yang berstatus `APPROVED` pada tahun yang diberikan menjadi `IN_PROGRESS`.\n\n' +
      'Endpoint ini hanya dapat diakses oleh **Admin**.',
  })
  @ApiParam({ name: 'year', description: 'Tahun periode (e.g. 2025)', type: 'number', example: 2025 })
  @ApiResponse({
    status: 200,
    description: 'Perubahan status berhasil dilakukan',
    schema: {
      properties: {
        isSuccess: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: {
          properties: {
            updatedCount: { type: 'number', example: 42 },
          },
        },
      },
    },
  })
  async changeApprovedToInProgress(@Param('year') year: string) {
    return this.approvalService.changeApprovedToInProgress(Number(year));
  }
}
