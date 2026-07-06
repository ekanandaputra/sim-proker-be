import { Activity } from '@prisma/client';
import { ActivityResponseDto } from '../dto/activity-response.dto';

export class ActivityMapper {
  static toResponse(activity: Activity): ActivityResponseDto {
    return {
      id: activity.id,
      programId: activity.programId,
      title: activity.title,
      description: activity.description,
      weight: Number(activity.weight),
      status: activity.status,
      startDate: activity.startDate,
      endDate: activity.endDate,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    };
  }

  static toResponseList(activities: Activity[]): ActivityResponseDto[] {
    return activities.map((a) => ActivityMapper.toResponse(a));
  }
}
