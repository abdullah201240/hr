import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  url: string;
  poolSize: number;
}

export default registerAs<DatabaseConfig>('database', () => ({
  url: process.env.DATABASE_URL || '',
  poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
}));
