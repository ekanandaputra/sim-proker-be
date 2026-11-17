import { Module } from '@nestjs/common';
import { ProgramArchiveController } from './program-archive.controller';
import { ProgramArchiveService } from './program-archive.service';

@Module({
  controllers: [ProgramArchiveController],
  providers: [ProgramArchiveService],
  exports: [ProgramArchiveService],
})
export class ProgramArchiveModule {}
