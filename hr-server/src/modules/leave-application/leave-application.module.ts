import { Module } from '@nestjs/common';
import { LeaveApplicationController } from './leave-application.controller';
import { LeaveApplicationService } from './leave-application.service';

@Module({
  controllers: [LeaveApplicationController],
  providers: [LeaveApplicationService],
  exports: [LeaveApplicationService],
})
export class LeaveApplicationModule {}
