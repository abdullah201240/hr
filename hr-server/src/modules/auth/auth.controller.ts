import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { FastifyRequest, FastifyReply } from 'fastify';
import '@fastify/cookie';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from './guards/public.decorator';
import { LoginThrottleGuard } from './guards/login-throttle.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;

  constructor(
    private readonly authService: AuthService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    this.isProduction = this.configService.get<string>('app.nodeEnv') === 'production';
  }

  /**
   * Get cookie options based on environment
   * Production: secure=true, sameSite='none' (requires HTTPS)
   * Development: secure=false, sameSite='lax' (works with HTTP)
   */
  private getCookieOptions() {
    return {
      httpOnly: true,
      secure: this.isProduction, // true only in production (HTTPS)
      sameSite: this.isProduction ? ('none' as const) : ('lax' as const),
      path: '/api/auth' as const,
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  }

  // ─── Login ──────────────────────────────────────────────────────────────

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoginThrottleGuard)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful, tokens returned',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const loginResult = await this.authService.login(dto);

    res.setCookie('refresh_token', loginResult.tokens.refreshToken, this.getCookieOptions());

    const { refreshToken, ...restTokens } = loginResult.tokens;
    return {
      tokens: restTokens,
      user: loginResult.user,
    };
  }

  // ─── Refresh Token ──────────────────────────────────────────────────────

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'New token pair issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
    @Body() dto: RefreshTokenDto,
  ) {
    const refreshToken = req.cookies.refresh_token || dto.refreshToken;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is missing');
    }

    const newTokens = await this.authService.refreshToken(refreshToken);

    res.setCookie('refresh_token', newTokens.refreshToken, this.getCookieOptions());

    const { refreshToken: _, ...restTokens } = newTokens;
    return { tokens: restTokens };
  }

  // ─── Logout ─────────────────────────────────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and blacklist current tokens' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
    @Body() dto: RefreshTokenDto,
  ) {
    // Extract access token from Authorization header
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : '';

    const refreshToken = req.cookies.refresh_token || dto.refreshToken;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is missing');
    }

    res.clearCookie('refresh_token', {
      path: '/api/auth',
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
    });

    return this.authService.logout(accessToken, refreshToken);
  }

  // ─── Get Profile ────────────────────────────────────────────────────────

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getProfile(@Req() req: FastifyRequest & { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }

  // ─── Change Password ────────────────────────────────────────────────────

  @Patch('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (invalidates all sessions)' })
  @ApiResponse({
    status: 200,
    description: 'Password changed, all sessions invalidated',
  })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  async changePassword(
    @Req() req: FastifyRequest & { user: { id: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.id, dto);
  }
}
