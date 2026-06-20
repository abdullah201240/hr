import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  controllers: [TasksController],
  providers: [TasksService, RealtimeGateway],
  exports: [TasksService, RealtimeGateway],
})
export class TasksModule {}

