import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { PerformanceProcessor } from './performance.processor';
import { KPI_CALCULATION_QUEUE } from '../queue/queue.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: KPI_CALCULATION_QUEUE,
    }),
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService, PerformanceProcessor],
  exports: [PerformanceService],
})
export class PerformanceModule {}
