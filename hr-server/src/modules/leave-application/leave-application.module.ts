import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { LEAVE_APPLICATION_QUEUE } from '../queue/queue.module';
import { LeaveApplicationController } from './leave-application.controller';
import { LeaveApplicationService } from './leave-application.service';
import { LeaveApplicationProcessor } from './leave-application.processor';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: LEAVE_APPLICATION_QUEUE }),
    NotificationsModule,
  ],
  controllers: [LeaveApplicationController],
  providers: [LeaveApplicationService, LeaveApplicationProcessor],
  exports: [LeaveApplicationService],
})
export class LeaveApplicationModule {}
