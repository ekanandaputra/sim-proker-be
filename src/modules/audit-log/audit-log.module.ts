import { Global, Module } from '@nestjs/common';
import { AuditLogController } from './controllers/audit-log.controller';
import { AuditLogService } from './services/audit-log.service';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from './repositories/audit-log.repository.interface';

@Global()
@Module({
  controllers: [AuditLogController],
  providers: [
    AuditLogService,
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: AuditLogRepository,
    },
  ],
  exports: [AuditLogService],
})
export class AuditLogModule {}
