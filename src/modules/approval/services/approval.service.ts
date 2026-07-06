import { Injectable, Inject, Logger } from '@nestjs/common';
import { ApprovalStatus, ProgramStatus } from '@prisma/client';
import { APPROVAL_REPOSITORY, IApprovalRepository } from '../repositories/approval.repository.interface';
import { PROGRAM_REPOSITORY, IProgramRepository } from '@modules/program/repositories/program.repository.interface';
import { ApprovalActionDto, ApprovalMapper, ApprovalResponseDto } from '../dto/approval.dto';
import { EntityNotFoundException, InvalidStateException } from '@common/exceptions';

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(
    @Inject(APPROVAL_REPOSITORY) private readonly approvalRepository: IApprovalRepository,
    @Inject(PROGRAM_REPOSITORY) private readonly programRepository: IProgramRepository,
  ) {}

  async submitProgram(programId: string, userId: string): Promise<ApprovalResponseDto> {
    const program = await this.programRepository.findById(programId);
    if (!program) throw new EntityNotFoundException('Program', programId);

    if (program.status !== ProgramStatus.DRAFT && program.status !== ProgramStatus.REVISION) {
      throw new InvalidStateException(
        `Program can only be submitted from DRAFT or REVISION status. Current: ${program.status}`,
      );
    }

    // Update program status
    await this.programRepository.update(programId, { status: ProgramStatus.SUBMITTED });

    // Create approval record
    const approval = await this.approvalRepository.create({
      status: ApprovalStatus.SUBMITTED,
      level: 1,
      program: { connect: { id: programId } },
    });

    this.logger.log(`Program ${programId} submitted for approval by ${userId}`);
    return ApprovalMapper.toResponse(approval);
  }

  async approve(approvalId: string, dto: ApprovalActionDto, userId: string): Promise<ApprovalResponseDto> {
    const approval = await this.approvalRepository.findById(approvalId);
    if (!approval) throw new EntityNotFoundException('Approval', approvalId);

    if (approval.status !== ApprovalStatus.SUBMITTED) {
      throw new InvalidStateException(`Approval can only be approved from SUBMITTED status. Current: ${approval.status}`);
    }

    const updated = await this.approvalRepository.update(approvalId, {
      status: ApprovalStatus.APPROVED,
      approverId: userId,
      note: dto.note,
      approvedAt: new Date(),
    });

    // Update program status
    await this.programRepository.update(approval.programId, { status: ProgramStatus.APPROVED });

    this.logger.log(`Approval ${approvalId} approved by ${userId}`);
    return ApprovalMapper.toResponse(updated);
  }

  async reject(approvalId: string, dto: ApprovalActionDto, userId: string): Promise<ApprovalResponseDto> {
    const approval = await this.approvalRepository.findById(approvalId);
    if (!approval) throw new EntityNotFoundException('Approval', approvalId);

    if (approval.status !== ApprovalStatus.SUBMITTED) {
      throw new InvalidStateException(`Approval can only be rejected from SUBMITTED status. Current: ${approval.status}`);
    }

    const updated = await this.approvalRepository.update(approvalId, {
      status: ApprovalStatus.REJECTED,
      approverId: userId,
      note: dto.note,
      approvedAt: new Date(),
    });

    await this.programRepository.update(approval.programId, { status: ProgramStatus.REJECTED });

    this.logger.log(`Approval ${approvalId} rejected by ${userId}`);
    return ApprovalMapper.toResponse(updated);
  }

  async requestRevision(approvalId: string, dto: ApprovalActionDto, userId: string): Promise<ApprovalResponseDto> {
    const approval = await this.approvalRepository.findById(approvalId);
    if (!approval) throw new EntityNotFoundException('Approval', approvalId);

    if (approval.status !== ApprovalStatus.SUBMITTED) {
      throw new InvalidStateException(`Revision can only be requested from SUBMITTED status. Current: ${approval.status}`);
    }

    const updated = await this.approvalRepository.update(approvalId, {
      status: ApprovalStatus.REVISION,
      approverId: userId,
      note: dto.note,
    });

    await this.programRepository.update(approval.programId, { status: ProgramStatus.REVISION });

    this.logger.log(`Approval ${approvalId} revision requested by ${userId}`);
    return ApprovalMapper.toResponse(updated);
  }
}
