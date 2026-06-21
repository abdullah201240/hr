import { Logger, Inject } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { NOTIFICATION_QUEUE, NotificationService } from './notifications.service';
import { DB_CONNECTION } from '../../db';
import type { Database } from '../../db';
import { notifications } from '../../db/schema/notifications';
import { and, eq, lt } from 'drizzle-orm';

@Processor(NOTIFICATION_QUEUE, { concurrency: 5 })
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationService: NotificationService,
    @Inject(DB_CONNECTION) private readonly db: Database,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing notification job: ${job.name} (job ID: ${job.id})`);

    try {
      if (job.name === 'delayed-delivery') {
        const dto = job.data;
        this.logger.log(`Executing delayed notification delivery for recipient: ${dto.recipientId}`);
        // Deliver bypassing quiet hours check
        return await this.notificationService.emit(dto, true);
      }

      if (job.name === 'cleanup-expired') {
        this.logger.log('Executing background notification cleanup and archiving...');
        return await this.runCleanup();
      }

      if (job.name === 'digest') {
        this.logger.log(`Processing digest queue job for recipient: ${job.data.recipientId}`);
        // Consolidate rate-limited notifications (mock/digest helper)
        return { status: 'queued_for_digest' };
      }

      this.logger.warn(`Unknown notification job name: ${job.name}`);
      return { status: 'ignored' };
    } catch (err: any) {
      this.logger.error(`Failed to process notification job ${job.name}: ${err.message}`, err.stack);
      throw err;
    }
  }

  /**
   * Run auto-archiving of expired notifications and purge archived notifications older than 90 days
   */
  private async runCleanup() {
    const now = new Date();
    
    // 1. Auto-archive notifications past expires_at
    const archivedResult = await this.db
      .update(notifications)
      .set({
        isArchived: true,
        updatedAt: now,
      })
      .where(
        and(
          eq(notifications.isArchived, false),
          lt(notifications.expiresAt, now)
        )
      );

    // 2. Hard purge archived notifications older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deletedResult = await this.db
      .delete(notifications)
      .where(
        and(
          eq(notifications.isArchived, true),
          lt(notifications.createdAt, ninetyDaysAgo)
        )
      );

    return {
      archivedCount: archivedResult.length,
      deletedCount: deletedResult.length,
    };
  }
}
