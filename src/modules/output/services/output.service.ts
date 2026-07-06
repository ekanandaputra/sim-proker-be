import { Injectable, Inject, Logger } from '@nestjs/common';
import { OUTPUT_REPOSITORY, IOutputRepository } from '../repositories/output.repository.interface';
import { CreateOutputDto, UpdateOutputDto, OutputMapper, OutputResponseDto } from '../dto/output.dto';
import { EntityNotFoundException } from '@common/exceptions';

@Injectable()
export class OutputService {
  private readonly logger = new Logger(OutputService.name);

  constructor(
    @Inject(OUTPUT_REPOSITORY) private readonly outputRepository: IOutputRepository,
  ) {}

  async findByActivityId(activityId: string): Promise<OutputResponseDto[]> {
    const outputs = await this.outputRepository.findByActivityId(activityId);
    return OutputMapper.toResponseList(outputs);
  }

  async create(activityId: string, dto: CreateOutputDto): Promise<OutputResponseDto> {
    const output = await this.outputRepository.create({
      metricType: dto.metricType,
      target: dto.target,
      realization: dto.realization,
      unit: dto.unit,
      description: dto.description,
      activity: { connect: { id: activityId } },
    });
    this.logger.log(`Output created: ${output.id} for activity ${activityId}`);
    return OutputMapper.toResponse(output);
  }

  async update(id: string, dto: UpdateOutputDto): Promise<OutputResponseDto> {
    const existing = await this.outputRepository.findById(id);
    if (!existing) throw new EntityNotFoundException('Output', id);
    const output = await this.outputRepository.update(id, dto);
    this.logger.log(`Output updated: ${id}`);
    return OutputMapper.toResponse(output);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.outputRepository.findById(id);
    if (!existing) throw new EntityNotFoundException('Output', id);
    await this.outputRepository.delete(id);
    this.logger.log(`Output deleted: ${id}`);
  }
}
