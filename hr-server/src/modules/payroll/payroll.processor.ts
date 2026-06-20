import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PAYROLL_QUEUE } from '../queue/queue.module';
import { PayrollService } from './payroll.service';
import { SalaryService } from '../salary/salary.service';

@Processor(PAYROLL_QUEUE, { concurrency: 2 })
export class PayrollProcessor extends WorkerHost {
  private readonly logger = new Logger(PayrollProcessor.name);

  constructor(
    private readonly payrollService: PayrollService,
    private readonly salaryService: SalaryService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing payroll job: ${job.name} (job ID: ${job.id})`);

    try {
      switch (job.name) {
        case 'generate-payroll': {
          const { cycleId, monthKey } = job.data;
          this.logger.log(`Executing generate-payroll background job for cycle ID: ${cycleId}`);
          return await this.payrollService.processGeneratePayroll(cycleId, monthKey);
        }

        case 'sync-payroll': {
          const { cycleId, monthKey } = job.data;
          this.logger.log(`Executing sync-payroll background job for cycle ID: ${cycleId}`);
          return await this.payrollService.processSyncPayroll(cycleId, monthKey);
        }

        case 'bulk-revision': {
          this.logger.log(`Executing bulk-revision background job`);
          return await this.salaryService.processBulkRevision(job.data);
        }

        case 'distribute-emails': {
          const { cycleId, monthKey } = job.data;
          this.logger.log(`Executing distribute-emails background job for cycle ID: ${cycleId}`);
          return await this.payrollService.processEmailDistribution(cycleId, monthKey);
        }

        case 'auto-generate-monthly-payroll': {
          this.logger.log(`Executing monthly scheduled auto-generate-payroll job`);
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const monthKey = `${year}-${month}`;
          this.logger.log(`Generating draft payroll for month key: ${monthKey}`);
          return await this.payrollService.getOrCreateCycle(monthKey);
        }

        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
          return { status: 'ignored' };
      }
    } catch (err: any) {
      this.logger.error(`Failed to process job ${job.name}: ${err.message}`, err.stack);
      throw err;
    }
  }
}
