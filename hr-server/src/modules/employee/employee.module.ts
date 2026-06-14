import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  EMPLOYEE_CREATE_QUEUE,
  EMPLOYEE_UPDATE_QUEUE,
} from '../queue/queue.module';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import {
  EmployeeCreateProcessor,
  EmployeeUpdateProcessor,
} from './employee.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: EMPLOYEE_CREATE_QUEUE }),
    BullModule.registerQueue({ name: EMPLOYEE_UPDATE_QUEUE }),
  ],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    EmployeeCreateProcessor,
    EmployeeUpdateProcessor,
  ],
  exports: [EmployeeService],
})
export class EmployeeModule {}
