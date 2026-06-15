import {
  Injectable,
  Inject,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { DB_CONNECTION, type Database } from '../../db';
import { employees } from '../../db/schema';
import { TokenBlacklistService } from './token-blacklist.service';
import type { LoginDto } from './dto/login.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  tokenType: 'Bearer';
}

export interface LoginResponse {
  tokens: TokenPair;
  user: {
    id: string;
    email: string;
    role: string;
    fullNameEnglish: string;
    employeePhotoUrl: string | null;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: Database,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenBlacklist: TokenBlacklistService,
  ) {}

  // ─── Login ──────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<LoginResponse> {
    const [user] = await this.db
      .select({
        id: employees.id,
        email: employees.email,
        role: employees.role,
        fullNameEnglish: employees.fullNameEnglish,
        employeePhotoUrl: employees.employeePhotoUrl,
        status: employees.status,
        passwordHash: employees.passwordHash,
        refreshTokenVersion: employees.refreshTokenVersion,
      })
      .from(employees)
      .where(eq(employees.email, dto.email))
      .limit(1);

    if (!user) {
      // Generic message to prevent user enumeration
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException(
        'Account is not active. Contact your administrator.',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate token pair
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.refreshTokenVersion,
    );

    // Update last login
    await this.db
      .update(employees)
      .set({ lastLoginAt: new Date() })
      .where(eq(employees.id, user.id));

    this.logger.log(`User logged in: ${user.email} (${user.id})`);

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullNameEnglish: user.fullNameEnglish,
        employeePhotoUrl: user.employeePhotoUrl,
      },
    };
  }

  // ─── Refresh Token ──────────────────────────────────────────────────────

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshTokenSecret')!,
      });
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'Refresh token has expired. Please login again.',
        );
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Verify user still exists and version matches
    const [user] = await this.db
      .select({
        id: employees.id,
        email: employees.email,
        role: employees.role,
        refreshTokenVersion: employees.refreshTokenVersion,
        status: employees.status,
      })
      .from(employees)
      .where(eq(employees.id, payload.sub))
      .limit(1);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User not found or inactive');
    }

    if (payload.ver !== user.refreshTokenVersion) {
      throw new UnauthorizedException('Refresh token has been invalidated');
    }

    // Blacklist the old refresh token
    if (payload.jti) {
      const remainingTtl = payload.exp - Math.floor(Date.now() / 1000);
      if (remainingTtl > 0) {
        await this.tokenBlacklist.blacklist(payload.jti, remainingTtl);
      }
    }

    // Issue new token pair (rotation)
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.refreshTokenVersion,
    );

    this.logger.debug(`Token refreshed for user: ${user.email}`);
    return tokens;
  }

  // ─── Logout ─────────────────────────────────────────────────────────────

  async logout(
    accessToken: string,
    refreshToken?: string,
  ): Promise<{ message: string }> {
    try {
      // Decode access token (don't verify — it might be expired but we still want to blacklist)
      const accessPayload = this.jwtService.decode(accessToken);
      if (accessPayload?.jti) {
        const ttl = accessPayload.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.tokenBlacklist.blacklist(accessPayload.jti, ttl);
        }
      }

      // Blacklist refresh token too
      if (refreshToken) {
        try {
          const refreshPayload = this.jwtService.verify(refreshToken, {
            secret: this.configService.get<string>('jwt.refreshTokenSecret')!,
            ignoreExpiration: true,
          });
          if (refreshPayload.jti) {
            const ttl = refreshPayload.exp - Math.floor(Date.now() / 1000);
            if (ttl > 0) {
              await this.tokenBlacklist.blacklist(refreshPayload.jti, ttl);
            }
          }
        } catch {
          // Refresh token is invalid — that's fine during logout
        }
      }
    } catch {
      // Token decode failure during logout is non-critical
    }

    return { message: 'Logged out successfully' };
  }

  // ─── Get Profile ────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const [user] = await this.db
      .select({
        id: employees.id,
        employeeId: employees.employeeId,
        email: employees.email,
        personalEmail: employees.personalEmail,
        fullNameEnglish: employees.fullNameEnglish,
        fullNameBangla: employees.fullNameBangla,
        phone: employees.phone,
        gender: employees.gender,
        role: employees.role,
        departmentId: employees.departmentId,
        designationId: employees.designationId,
        employeeType: employees.employeeType,
        employeePhotoUrl: employees.employeePhotoUrl,
        joinDate: employees.joinDate,
        status: employees.status,
        isEmailVerified: employees.isEmailVerified,
        lastLoginAt: employees.lastLoginAt,
        createdAt: employees.createdAt,
      })
      .from(employees)
      .where(and(eq(employees.id, userId), eq(employees.status, 'active')))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  // ─── Change Password ────────────────────────────────────────────────────

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const [user] = await this.db
      .select({
        passwordHash: employees.passwordHash,
        refreshTokenVersion: employees.refreshTokenVersion,
      })
      .from(employees)
      .where(eq(employees.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

    // Update password AND increment token version (invalidates ALL refresh tokens)
    await this.db
      .update(employees)
      .set({
        passwordHash: newPasswordHash,
        refreshTokenVersion: user.refreshTokenVersion + 1,
      })
      .where(eq(employees.id, userId));

    this.logger.log(`Password changed for user: ${userId}`);
    return {
      message:
        'Password changed successfully. All sessions have been invalidated.',
    };
  }

  // ─── Token Generation ───────────────────────────────────────────────────

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    version: number,
  ): Promise<TokenPair> {
    const accessExpiry = this.configService.get<string>(
      'jwt.accessTokenExpiry',
      '15m',
    ) as any;
    const refreshExpiry = this.configService.get<string>(
      'jwt.refreshTokenExpiry',
      '7d',
    ) as any;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
          ver: version,
          jti: randomUUID(),
        },
        {
          secret: this.configService.get<string>('jwt.accessTokenSecret')!,
          expiresIn: accessExpiry,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
          ver: version,
          jti: randomUUID(),
        },
        {
          secret: this.configService.get<string>('jwt.refreshTokenSecret')!,
          expiresIn: refreshExpiry,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiry,
      tokenType: 'Bearer',
    };
  }
}
