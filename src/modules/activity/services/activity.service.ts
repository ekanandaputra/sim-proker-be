import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  ACTIVITY_REPOSITORY,
  IActivityRepository,
} from '../repositories/activity.repository.interface';
import { CreateActivityDto } from '../dto/activity.dto';
import { UpdateActivityDto } from '../dto/activity.dto';
import { ActivityResponseDto } from '../dto/activity-response.dto';
import { ActivityMapper } from '../mapper/activity.mapper';
import { EntityNotFoundException } from '@common/exceptions';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepository: IActivityRepository,
  ) {}

  async findByProgramId(programId: string): Promise<ActivityResponseDto[]> {
    const activities = await this.activityRepository.findByProgramId(programId);
    return ActivityMapper.toResponseList(activities);
  }

  async findById(id: string): Promise<ActivityResponseDto> {
    const activity = await this.activityRepository.findById(id);
    if (!activity) {
      throw new EntityNotFoundException('Activity', id);
    }
    return ActivityMapper.toResponse(activity);
  }

  async create(programId: string, dto: CreateActivityDto): Promise<ActivityResponseDto> {
    const activity = await this.activityRepository.create({
      title: dto.title,
      description: dto.description,
      weight: dto.weight,
      startDate: dto.startDate,
      endDate: dto.endDate,
      program: { connect: { id: programId } },
    });

    this.logger.log(`Activity created: ${activity.id} for program ${programId}`);
    return ActivityMapper.toResponse(activity);
  }

  async update(id: string, dto: UpdateActivityDto): Promise<ActivityResponseDto> {
    const existing = await this.activityRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Activity', id);
    }

    const activity = await this.activityRepository.update(id, dto);
    this.logger.log(`Activity updated: ${id}`);
    return ActivityMapper.toResponse(activity);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.activityRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Activity', id);
    }

    await this.activityRepository.delete(id);
    this.logger.log(`Activity deleted: ${id}`);
  }
}
