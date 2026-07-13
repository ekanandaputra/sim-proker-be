import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PrismaModule } from '@database/prisma/prisma.module';
import { AppLoggerModule } from '@common/logger';
import { CorrelationIdMiddleware } from '@common/middleware';
import { ProgramModule } from '@modules/program/program.module';
import { ActivityModule } from '@modules/activity/activity.module';
import { OutputModule } from '@modules/output/output.module';
import { ProgressModule } from '@modules/progress/progress.module';
import { EvidenceModule } from '@modules/evidence/evidence.module';
import { ApprovalModule } from '@modules/approval/approval.module';
import { DashboardModule } from '@modules/dashboard/dashboard.module';
import { IntegrationModule } from './integrations/integration.module';
import { AuthIntegrationModule } from '@modules/external/auth-integration/auth-integration.module';
import { IkuIntegrationModule } from '@modules/external/iku-integration/iku-integration.module';
import { UnitModule } from '@modules/unit/unit.module';
import { AuditLogModule } from '@modules/audit-log/audit-log.module';
import { DefaultProgramModule } from '@modules/default-program/default-program.module';
import { IkuModule } from '@modules/iku/iku.module';

@Module({
  imports: [
    // Infrastructure
    PrismaModule,
    AppLoggerModule,
    AuditLogModule,

    // Domain Modules
    ProgramModule,
    ActivityModule,
    OutputModule,
    ProgressModule,
    EvidenceModule,
    ApprovalModule,
    DashboardModule,
    DefaultProgramModule,
    IkuModule,

    // Integration
    IntegrationModule,
    AuthIntegrationModule,
    IkuIntegrationModule,
    UnitModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
