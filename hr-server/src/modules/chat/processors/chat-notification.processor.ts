import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('chat-notification')
export class ChatNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(ChatNotificationProcessor.name);

  /**
   * Process incoming offline chat notification dispatch jobs
   */
  async process(job: Job<any, any, string>): Promise<any> {
    const { roomId, senderId, content, recipients } = job.data;

    this.logger.log(
      `Processing offline notification job [${job.id}]: dispatching alerts for room ${roomId} from sender ${senderId}`
    );

    // Mock dispatching email/push alerts for offline recipients
    for (const recipient of recipients) {
      this.logger.log(
        `[NOTIFICATION DISPATCH] Alerting offline employee ${recipient.name} (${recipient.email}): "New message from teammate: ${content.substring(0, 30)}..."`
      );
    }

    return { success: true, count: recipients.length };
  }
}
