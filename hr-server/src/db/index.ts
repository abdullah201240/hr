import { Module, Global, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DB_CONNECTION = Symbol('DB_CONNECTION');

export type Database = PostgresJsDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DB_CONNECTION,
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('database.url')!;
        const poolSize = configService.get<number>('database.poolSize', 10);

        const client = postgres(connectionString, {
          max: poolSize,
          idle_timeout: 20,
          connect_timeout: 10,
        });

        return drizzle(client, { schema, logger: false });
      },
      inject: [ConfigService],
    },
  ],
  exports: [DB_CONNECTION],
})
export class DatabaseModule {}
