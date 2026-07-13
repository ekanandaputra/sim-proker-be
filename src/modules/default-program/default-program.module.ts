import { Module } from '@nestjs/common';
import { DefaultProgramController } from './controllers/default-program.controller';
import { DefaultProgramService } from './services/default-program.service';

@Module({
  controllers: [DefaultProgramController],
  providers: [DefaultProgramService],
  exports: [DefaultProgramService],
})
export class DefaultProgramModule {}
