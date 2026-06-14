import { registerAs } from '@nestjs/config';

export interface JwtConfig {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

export default registerAs<JwtConfig>('jwt', () => {
  const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
  const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessTokenSecret || !refreshTokenSecret) {
    throw new Error(
      'JWT secrets are missing. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env',
    );
  }

  return {
    accessTokenSecret,
    refreshTokenSecret,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  };
});
