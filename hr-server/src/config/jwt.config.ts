import { registerAs } from '@nestjs/config';
import { Logger } from '@nestjs/common';

export interface JwtConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

const logger = new Logger('JwtConfig');

export default registerAs<JwtConfig>('jwt', () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  let accessTokenSecret = process.env.JWT_ACCESS_SECRET;
  let refreshTokenSecret = process.env.JWT_REFRESH_SECRET;

  // Development fallback with strong warning
  if (nodeEnv === 'development' && (!accessTokenSecret || !refreshTokenSecret)) {
    logger.warn(
      '⚠️  JWT secrets not configured. Using development fallback secrets.',
    );
    logger.warn(
      '⚠️  NEVER use these in production! Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env',
    );
    
    accessTokenSecret = accessTokenSecret || 'dev-access-secret-CHANGE-THIS-IN-PRODUCTION-DO-NOT-USE';
    refreshTokenSecret = refreshTokenSecret || 'dev-refresh-secret-CHANGE-THIS-IN-PRODUCTION-DO-NOT-USE';
  }

  // Production: throw error if secrets are missing
  if (nodeEnv === 'production' && (!accessTokenSecret || !refreshTokenSecret)) {
    throw new Error(
      'JWT secrets are missing. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env',
    );
  }

  return {
    accessTokenSecret: accessTokenSecret!,
    refreshTokenSecret: refreshTokenSecret!,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  };
});
