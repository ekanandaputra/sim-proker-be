import { Injectable, Inject, Logger } from '@nestjs/common';
import { PROGRESS_REPOSITORY, IProgressRepository } from '../repositories/progress.repository.interface';
import { CreateProgressDto, ProgressMapper, ProgressResponseDto } from '../dto/progress.dto';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    @Inject(PROGRESS_REPOSITORY) private readonly progressRepository: IProgressRepository,
  ) {}

  async findByActivityId(activityId: string): Promise<ProgressResponseDto[]> {
    const logs = await this.progressRepository.findByActivityId(activityId);
    return ProgressMapper.toResponseList(logs);
  }

  async create(activityId: string, dto: CreateProgressDto, userId: string): Promise<ProgressResponseDto> {
    const log = await this.progressRepository.create({
      progress: dto.progress,
      note: dto.note,
      createdBy: userId,
      activity: { connect: { id: activityId } },
    });
    this.logger.log(`Progress logged: ${log.id} for activity ${activityId} (${dto.progress}%)`);
    return ProgressMapper.toResponse(log);
  }
}
