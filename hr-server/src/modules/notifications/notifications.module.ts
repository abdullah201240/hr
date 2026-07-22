import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JwtModule } from '@nestjs/jwt';
import { NotificationController } from './notifications.controller';
import { NOTIFICATION_QUEUE, NotificationService } from './notifications.service';
import { PreferencesService } from './services/preferences.service';
import { NotificationGateway } from './notifications.gateway';
import { DeduplicationGuard } from './guards/deduplication.guard';
import { NotificationRateLimiter } from './guards/rate-limiter.guard';
import { NotificationProcessor } from './notifications.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE,
    }),
    JwtModule.register({}),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    PreferencesService,
    NotificationGateway,
    DeduplicationGuard,
    NotificationRateLimiter,
    NotificationProcessor,
  ],
  exports: [NotificationService, PreferencesService],
})
export class NotificationsModule {}
