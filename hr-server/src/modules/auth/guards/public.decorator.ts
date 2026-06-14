import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Mark a route as publicly accessible (no JWT required).
 * Use on login, refresh, and health-check endpoints.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
