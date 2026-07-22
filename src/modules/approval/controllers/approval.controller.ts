import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ApprovalService } from '../services/approval.service';
import { approvalActionSchema, ApprovalActionDto, ApprovalResponseDto } from '../dto/approval.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@common/pipes/zod-validation.pipe';
import { JwtPayload } from '@common/guards';
import { Role } from '@common/constants';

@ApiTags('Approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Post('programs/:id/submit')
  @Roles(Role.ADMIN, Role.UNIT_ADMIN, Role.PIC)
  @ApiOperation({ summary: 'Submit program for approval', description: 'Submits a program from DRAFT/REVISION status to the approval workflow.' })
  @ApiParam({ name: 'id', description: 'Program UUID', type: 'string' })
  @ApiResponse({ status: 201, description: 'Program submitted successfully', type: ApprovalResponseDto })
  @ApiResponse({ status: 400, description: 'Validation or state error' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async submit(@Param('id') programId: string, @CurrentUser() user: JwtPayload) {
    return this.approvalService.submitProgram(programId, user.userId);
  }

  @Post('approvals/:id/approve')
  @Roles(Role.ADMIN, Role.REVIEWER, Role.LEADER)
  @ApiOperation({ summary: 'Approve an approval request', description: 'Approves a pending request in the workflow' })
  @ApiParam({ name: 'id', description: 'Approval UUID', type: 'string' })
  @ApiBody({ type: ApprovalActionDto })
  @ApiResponse({ status: 201, description: 'Approval successful', type: ApprovalResponseDto })
  @ApiResponse({ status: 400, description: 'Validation or state error' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  async approve(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(approvalActionSchema)) dto: ApprovalActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.approvalService.approve(id, dto, user.userId);
  }

  @Post('approvals/:id/reject')
  @Roles(Role.ADMIN, Role.REVIEWER, Role.LEADER)
  @ApiOperation({ summary: 'Reject an approval request', description: 'Rejects a pending request in the workflow' })
  @ApiParam({ name: 'id', description: 'Approval UUID', type: 'string' })
  @ApiBody({ type: ApprovalActionDto })
  @ApiResponse({ status: 201, description: 'Rejection successful', type: ApprovalResponseDto })
  @ApiResponse({ status: 400, description: 'Validation or state error' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  async reject(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(approvalActionSchema)) dto: ApprovalActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.approvalService.reject(id, dto, user.userId);
  }

  @Post('approvals/:id/revision')
  @Roles(Role.ADMIN, Role.REVIEWER, Role.LEADER)
  @ApiOperation({ summary: 'Request revision for an approval', description: 'Requests a revision for a pending request in the workflow' })
  @ApiParam({ name: 'id', description: 'Approval UUID', type: 'string' })
  @ApiBody({ type: ApprovalActionDto })
  @ApiResponse({ status: 201, description: 'Revision requested', type: ApprovalResponseDto })
  @ApiResponse({ status: 400, description: 'Validation or state error' })
  @ApiResponse({ status: 404, description: 'Approval request not found' })
  async revision(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(approvalActionSchema)) dto: ApprovalActionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.approvalService.requestRevision(id, dto, user.userId);
  }
}
