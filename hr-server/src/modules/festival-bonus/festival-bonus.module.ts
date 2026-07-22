import { Module } from '@nestjs/common';
import { FestivalBonusService } from './festival-bonus.service';
import { FestivalBonusController } from './festival-bonus.controller';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [FestivalBonusController],
  providers: [FestivalBonusService],
  exports: [FestivalBonusService],
})
export class FestivalBonusModule {}
