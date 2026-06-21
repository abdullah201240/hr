import { Module } from '@nestjs/common';
import { SeparationController } from './separation.controller';
import { SeparationService } from './separation.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [SeparationController],
  providers: [SeparationService],
  exports: [SeparationService],
})
export class SeparationModule {}
