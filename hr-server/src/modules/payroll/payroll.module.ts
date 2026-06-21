import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PayrollProcessor } from './payroll.processor';
import { SalaryModule } from '../salary/salary.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'payroll',
    }),
    SalaryModule,
    NotificationsModule,
  ],
  controllers: [PayrollController],
  providers: [PayrollService, PayrollProcessor],
  exports: [PayrollService],
})
export class PayrollModule {}
