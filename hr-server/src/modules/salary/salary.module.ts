import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SalaryService } from './salary.service';
import { SalaryController } from './salary.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'payroll',
    }),
  ],
  providers: [SalaryService],
  controllers: [SalaryController],
  exports: [SalaryService],
})
export class SalaryModule {}
