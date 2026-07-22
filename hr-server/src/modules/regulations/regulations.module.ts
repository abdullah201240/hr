import { Module } from '@nestjs/common';
import { RegulationsService } from './regulations.service';
import { RegulationsController } from './regulations.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [RegulationsService],
  controllers: [RegulationsController],
  exports: [RegulationsService],
})
export class RegulationsModule {}
