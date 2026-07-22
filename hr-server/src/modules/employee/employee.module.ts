import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  EMPLOYEE_CREATE_QUEUE,
  EMPLOYEE_UPDATE_QUEUE,
  EMPLOYEE_STATUS_QUEUE,
} from '../queue/queue.module';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import {
  EmployeeCreateProcessor,
  EmployeeUpdateProcessor,
  EmployeeStatusProcessor,
} from './employee.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: EMPLOYEE_CREATE_QUEUE }),
    BullModule.registerQueue({ name: EMPLOYEE_UPDATE_QUEUE }),
    BullModule.registerQueue({ name: EMPLOYEE_STATUS_QUEUE }),
  ],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    EmployeeCreateProcessor,
    EmployeeUpdateProcessor,
    EmployeeStatusProcessor,
  ],
  exports: [EmployeeService],
})
export class EmployeeModule {}
