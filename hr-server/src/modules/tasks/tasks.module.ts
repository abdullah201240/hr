import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { RealtimeGateway } from './realtime.gateway';
import { TasksProcessor } from './tasks.processor';
import { TASK_RECURRENCE_QUEUE } from '../queue/queue.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: TASK_RECURRENCE_QUEUE,
    }),
    NotificationsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, RealtimeGateway, TasksProcessor],
  exports: [TasksService, RealtimeGateway],
})
export class TasksModule {}

