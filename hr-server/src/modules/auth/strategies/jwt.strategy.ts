import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { DB_CONNECTION, type Database } from '../../../db/index.js';
import { employees } from '../../../db/schema/index.js';
import { TokenBlacklistService } from '../token-blacklist.service.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  ver: number;
  jti: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly tokenBlacklist: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessTokenSecret')!,
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload) {
    // 1. Check if token is blacklisted
    if (payload.jti) {
      const isRevoked = await this.tokenBlacklist.isBlacklisted(payload.jti);
      if (isRevoked) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    // 2. Verify user exists and is active
    const [user] = await this.db
      .select({
        id: employees.id,
        email: employees.email,
        role: employees.role,
        status: employees.status,
        refreshTokenVersion: employees.refreshTokenVersion,
        fullNameEnglish: employees.fullNameEnglish,
        employeePhotoUrl: employees.employeePhotoUrl,
      })
      .from(employees)
      .where(eq(employees.id, payload.sub))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    // 3. Verify token version matches (catches password changes / forced logout)
    if (payload.ver !== user.refreshTokenVersion) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    // Attach user to request
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullNameEnglish: user.fullNameEnglish,
      employeePhotoUrl: user.employeePhotoUrl,
    };
  }
}
