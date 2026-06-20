import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TASK_RECURRENCE_QUEUE } from '../queue/queue.module';
import { TasksService } from './tasks.service';

@Processor(TASK_RECURRENCE_QUEUE, { concurrency: 5 })
export class TasksProcessor extends WorkerHost {
  private readonly logger = new Logger(TasksProcessor.name);

  constructor(private readonly tasksService: TasksService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing task queue job: ${job.name} (job ID: ${job.id})`);

    try {
      if (job.name === 'process-recurrence') {
        const { taskId, userId } = job.data;
        this.logger.log(`Executing background task recurrence for task ID: ${taskId}`);
        return await this.tasksService.handleRecurrenceClone(taskId, userId);
      }

      this.logger.warn(`Unknown job name: ${job.name}`);
      return { status: 'ignored' };
    } catch (err: any) {
      this.logger.error(`Failed to process job ${job.name}: ${err.message}`, err.stack);
      throw err;
    }
  }
}
