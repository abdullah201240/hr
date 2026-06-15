import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as path from 'path';
import { Logger } from '@nestjs/common';

const logger = new Logger('DatabaseMigrations');

export async function runDatabaseMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    logger.error('DATABASE_URL is not set. Cannot run migrations.');
    throw new Error('DATABASE_URL is not set.');
  }

  logger.log('Starting programmatic database migrations check...');

  // Single-use client for migration execution
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    // Resolve correct migrations folder based on running environment (dev vs compiled production dist)
    const migrationsFolder = path.resolve(__dirname, 'migrations');
    logger.log(`Looking for migrations in: ${migrationsFolder}`);

    await migrate(db, { migrationsFolder });
    logger.log('Database migrations completed successfully.');
  } catch (error) {
    logger.error('Database migration failed:', error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}
