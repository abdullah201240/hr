import { Injectable, Inject, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../../db';
import { employees } from '../../../db/schema';
import { TokenBlacklistService } from '../token-blacklist.service';
import { CacheService } from '../../../common/cache/cache.service';
import { CacheKeys } from '../../../common/cache/cache-keys';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  departmentId: string | null;
  ver: number;
  jti: string;
  iat: number;
  exp: number;
}

export interface JwtUser {
  id: string;
  email: string;
  role: string;
  departmentId: string | null;
  fullNameEnglish: string;
  employeePhotoUrl: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly tokenBlacklist: TokenBlacklistService,
    private readonly cache: CacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessTokenSecret')!,
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    // 1. Check if token is blacklisted
    if (payload.jti) {
      const isRevoked = await this.tokenBlacklist.isBlacklisted(payload.jti);
      if (isRevoked) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    // 2. Check cache for validated user (avoids DB hit on every request)
    const cached = await this.cache.getByKey<
      JwtUser & { ver: number; status: string }
    >(CacheKeys.jwtValidate, payload.sub);

    if (cached) {
      // Verify version from cache
      if (cached.ver !== payload.ver) {
        throw new UnauthorizedException('Token has been invalidated');
      }
      if (cached.status !== 'active') {
        throw new UnauthorizedException('Account is not active');
      }
      return {
        id: cached.id,
        email: cached.email,
        role: cached.role,
        departmentId: cached.departmentId ?? payload.departmentId ?? null,
        fullNameEnglish: cached.fullNameEnglish,
        employeePhotoUrl: cached.employeePhotoUrl,
      };
    }

    // 3. Cache miss — verify user exists and is active (with retry logic)
    let user;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        [user] = await this.db
          .select({
            id: employees.id,
            email: employees.email,
            role: employees.role,
            departmentId: employees.departmentId,
            status: employees.status,
            refreshTokenVersion: employees.refreshTokenVersion,
            fullNameEnglish: employees.fullNameEnglish,
            employeePhotoUrl: employees.employeePhotoUrl,
          })
          .from(employees)
          .where(eq(employees.id, payload.sub))
          .limit(1);
        break; // Success - exit retry loop
      } catch (error) {
        retries++;
        if (retries === maxRetries) {
          this.logger.error(
            `Database query failed after ${maxRetries} attempts for user ${payload.sub}`,
            error instanceof Error ? error.stack : undefined,
          );
          throw new UnauthorizedException('Authentication service temporarily unavailable');
        }
        // Exponential backoff: 100ms, 200ms, 400ms
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retries - 1)));
        this.logger.warn(
          `Database query attempt ${retries}/${maxRetries} failed, retrying...`,
        );
      }
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    // 4. Verify token version matches (catches password changes / forced logout)
    if (payload.ver !== user.refreshTokenVersion) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    // 5. Cache the validation result for subsequent requests
    const userToCache = {
      id: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId ?? null,
      fullNameEnglish: user.fullNameEnglish,
      employeePhotoUrl: user.employeePhotoUrl,
      ver: user.refreshTokenVersion,
      status: user.status,
    };
    await this.cache.setByKey(CacheKeys.jwtValidate, userToCache, user.id);

    // Return user to attach to request
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId ?? null,
      fullNameEnglish: user.fullNameEnglish,
      employeePhotoUrl: user.employeePhotoUrl,
    };
  }
}
