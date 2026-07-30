import { Module } from '@nestjs/common';

import { DocumentController } from './controllers/document.controller';
import { DocumentService } from './services/document.service';
import { DocumentRepository } from './repositories/document.repository';
import { DOCUMENT_REPOSITORY } from './repositories/document.repository.interface';
import { StorageModule } from '@common/storage';

@Module({
  imports: [
    StorageModule,
  ],
  controllers: [DocumentController],
  providers: [
    DocumentService,
    { provide: DOCUMENT_REPOSITORY, useClass: DocumentRepository },
  ],
  exports: [DocumentService],
})
export class DocumentModule {}
