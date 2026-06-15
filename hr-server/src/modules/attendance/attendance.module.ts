import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceProcessor } from './attendance.processor';
import { AttendanceSettingsModule } from '../attendance-settings/attendance-settings.module';

@Module({
  imports: [
    AttendanceSettingsModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceProcessor],
  exports: [AttendanceService],
})
export class AttendanceModule {}
