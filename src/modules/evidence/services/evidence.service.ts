import { Injectable, Inject, Logger } from '@nestjs/common';
import 'multer';
import { EVIDENCE_REPOSITORY, IEvidenceRepository } from '../repositories/evidence.repository.interface';
import { STORAGE_SERVICE, IStorageService } from '@common/storage/storage.interface';
import { EvidenceMapper, EvidenceResponseDto } from '../dto/evidence.dto';
import { EntityNotFoundException } from '@common/exceptions';

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);

  constructor(
    @Inject(EVIDENCE_REPOSITORY) private readonly evidenceRepository: IEvidenceRepository,
    @Inject(STORAGE_SERVICE) private readonly storageService: IStorageService,
  ) {}

  async findByActivityId(activityId: string): Promise<EvidenceResponseDto[]> {
    const evidences = await this.evidenceRepository.findByActivityId(activityId);
    return EvidenceMapper.toResponseList(evidences);
  }

  async upload(
    activityId: string,
    file: Express.Multer.File,
    userId: string,
  ): Promise<EvidenceResponseDto> {
    const filePath = await this.storageService.upload(file, 'evidences');

    const evidence = await this.evidenceRepository.create({
      fileName: file.originalname,
      filePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedBy: userId,
      activity: { connect: { id: activityId } },
    });

    this.logger.log(`Evidence uploaded: ${evidence.id} for activity ${activityId}`);
    return EvidenceMapper.toResponse(evidence);
  }

  async remove(id: string): Promise<void> {
    const evidence = await this.evidenceRepository.findById(id);
    if (!evidence) {
      throw new EntityNotFoundException('Evidence', id);
    }

    // Delete file from storage
    await this.storageService.delete(evidence.filePath);

    // Delete database record
    await this.evidenceRepository.delete(id);
    this.logger.log(`Evidence deleted: ${id}`);
  }
}
