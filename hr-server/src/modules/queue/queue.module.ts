import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

export const EMPLOYEE_CREATE_QUEUE = 'employee-create';
export const EMPLOYEE_UPDATE_QUEUE = 'employee-update';
export const EMPLOYEE_STATUS_QUEUE = 'employee-status';
export const ATTENDANCE_QUEUE = 'attendance';
export const LEAVE_APPLICATION_QUEUE = 'leave-application';
export const TASK_RECURRENCE_QUEUE = 'task-recurrence';
export const KPI_CALCULATION_QUEUE = 'kpi-calculation';
export const PAYROLL_QUEUE = 'payroll';
export const NOTIFICATION_QUEUE = 'notifications';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('bullmq.redis.host', 'localhost'),
          port: config.get<number>('bullmq.redis.port', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: EMPLOYEE_CREATE_QUEUE,
    }),
    BullModule.registerQueue({
      name: EMPLOYEE_UPDATE_QUEUE,
    }),
    BullModule.registerQueue({
      name: EMPLOYEE_STATUS_QUEUE,
    }),
    BullModule.registerQueue({
      name: ATTENDANCE_QUEUE,
    }),
    BullModule.registerQueue({
      name: LEAVE_APPLICATION_QUEUE,
    }),
    BullModule.registerQueue({
      name: TASK_RECURRENCE_QUEUE,
    }),
    BullModule.registerQueue({
      name: KPI_CALCULATION_QUEUE,
    }),
    BullModule.registerQueue({
      name: PAYROLL_QUEUE,
    }),
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE,
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
