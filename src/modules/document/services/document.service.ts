import { Injectable, Inject, Logger } from '@nestjs/common';
import 'multer';
import { DOCUMENT_REPOSITORY, IDocumentRepository } from '../repositories/document.repository.interface';
import { STORAGE_SERVICE, IStorageService } from '@common/storage/storage.interface';
import { DocumentMapper, DocumentResponseDto } from '../dto/document.dto';
import { EntityNotFoundException } from '@common/exceptions';
import { DocumentType } from '@prisma/client';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documentRepository: IDocumentRepository,
    @Inject(STORAGE_SERVICE) private readonly storageService: IStorageService,
  ) {}

  async findByActivityId(activityId: string): Promise<DocumentResponseDto[]> {
    const documents = await this.documentRepository.findByActivityId(activityId);
    return DocumentMapper.toResponseList(documents);
  }

  async upload(
    activityId: string,
    file: Express.Multer.File,
    type: DocumentType,
    userId: string,
  ): Promise<DocumentResponseDto> {
    const filePath = await this.storageService.upload(file, 'documents');

    const document = await this.documentRepository.create({
      fileName: file.originalname,
      filePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      type,
      uploadedBy: userId,
      activity: { connect: { id: activityId } },
    });

    this.logger.log(`Document uploaded: ${document.id} for activity ${activityId}`);
    return DocumentMapper.toResponse(document);
  }

  async uploadUniversal(
    file: Express.Multer.File,
    type: DocumentType,
    userId: string,
  ): Promise<DocumentResponseDto> {
    const filePath = await this.storageService.upload(file, 'documents');

    const document = await this.documentRepository.create({
      fileName: file.originalname,
      filePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      type,
      uploadedBy: userId,
    });

    this.logger.log(`Document uploaded (universal): ${document.id}`);
    return DocumentMapper.toResponse(document);
  }

  async remove(id: string): Promise<void> {
    const document = await this.documentRepository.findById(id);
    if (!document) {
      throw new EntityNotFoundException('Document', id);
    }

    // Delete file from storage
    await this.storageService.delete(document.filePath);

    // Delete database record
    await this.documentRepository.delete(id);
    this.logger.log(`Document deleted: ${id}`);
  }
}
