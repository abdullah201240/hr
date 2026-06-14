import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

export const EMPLOYEE_CREATE_QUEUE = 'employee-create';
export const EMPLOYEE_UPDATE_QUEUE = 'employee-update';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('bullmq.redis.host', 'localhost'),
          port: config.get<number>('bullmq.redis.port', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: EMPLOYEE_CREATE_QUEUE,
    }),
    BullModule.registerQueue({
      name: EMPLOYEE_UPDATE_QUEUE,
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
