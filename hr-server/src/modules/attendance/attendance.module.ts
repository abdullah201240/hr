import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceProcessor } from './attendance.processor';
import { AttendanceSettingsModule } from '../attendance-settings/attendance-settings.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    AttendanceSettingsModule,
    NotificationsModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceProcessor],
  exports: [AttendanceService],
})
export class AttendanceModule {}
