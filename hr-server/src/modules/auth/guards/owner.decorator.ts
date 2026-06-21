import { SetMetadata } from '@nestjs/common';

export const OWNER_ONLY_KEY = 'owner_only';

/**
 * Mark an endpoint as owner-only. When applied:
 * - Admin and HR bypass the check (full access)
 * - Manager bypasses the check (team access)
 * - Employee: can only access resources where the route :id param matches their own user ID
 *
 * Must be used alongside the globally registered OwnershipGuard.
 * Usage: @OwnerOnly()
 */
export const OwnerOnly = () => SetMetadata(OWNER_ONLY_KEY, true);
