import { Module } from '@nestjs/common';

import { TemplateController } from './controllers/template.controller';
import { TemplateService } from './services/template.service';
import { TemplateRepository } from './repositories/template.repository';
import { TEMPLATE_REPOSITORY } from './repositories/template.repository.interface';
import { StorageModule } from '@common/storage';

@Module({
  imports: [
    StorageModule,
  ],
  controllers: [TemplateController],
  providers: [
    TemplateService,
    { provide: TEMPLATE_REPOSITORY, useClass: TemplateRepository },
  ],
  exports: [TemplateService],
})
export class TemplateModule {}
