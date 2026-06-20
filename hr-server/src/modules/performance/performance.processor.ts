import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { KPI_CALCULATION_QUEUE } from '../queue/queue.module';
import { PerformanceService } from './performance.service';

@Processor(KPI_CALCULATION_QUEUE, { concurrency: 2 })
export class PerformanceProcessor extends WorkerHost {
  private readonly logger = new Logger(PerformanceProcessor.name);

  constructor(private readonly performanceService: PerformanceService) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing performance queue job: ${job.name} (job ID: ${job.id})`);

    try {
      if (job.name === 'initialize-cycle-kpis') {
        const { cycleId } = job.data;
        this.logger.log(`Initializing bulk KPIs for cycle ID: ${cycleId}`);
        return await this.performanceService.bulkInitializeCycleKpis(cycleId);
      }

      if (job.name === 'calculate-appraisal-grades') {
        const { cycleId } = job.data;
        this.logger.log(`Computing bulk appraisal grades for cycle ID: ${cycleId}`);
        return await this.performanceService.bulkCalculateCycleGrades(cycleId);
      }

      this.logger.warn(`Unknown job name: ${job.name}`);
      return { status: 'ignored' };
    } catch (err: any) {
      this.logger.error(`Failed to process job ${job.name}: ${err.message}`, err.stack);
      throw err;
    }
  }
}
