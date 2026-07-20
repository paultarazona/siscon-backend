import { Body, Controller, Post, Res } from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

function buildSessionCookieOptions(maxAge?: number): CookieOptions {
  const options: CookieOptions = { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' };
  if (maxAge !== undefined) options.maxAge = maxAge;
  if (process.env.COOKIE_DOMAIN) options.domain = process.env.COOKIE_DOMAIN;
  return options;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.login(dto);
    response.cookie('siscon_session', session.accessToken, buildSessionCookieOptions(8 * 60 * 60 * 1000));
    return { user: session.user };
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('siscon_session', buildSessionCookieOptions());
    return { message: 'Sesión cerrada.' };
  }
}
