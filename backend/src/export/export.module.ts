import { Module } from '@nestjs/common';
import { ExportService } from './services/export/export.service';
import { SharedModule } from 'src/shared/shared.module';
import { ExportController } from './export.controller';

@Module({
  imports: [SharedModule],
  providers: [ExportService],
  controllers: [ExportController],
})
export class ExportModule {}
