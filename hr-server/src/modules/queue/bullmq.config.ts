import { registerAs } from '@nestjs/config';

export interface BullMQConfig {
  concurrency: number;
  redis: {
    host: string;
    port: number;
  };
}

export default registerAs<BullMQConfig>('bullmq', () => ({
  concurrency: parseInt(process.env.BULLMQ_CONCURRENCY || '5', 10),
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
}));
