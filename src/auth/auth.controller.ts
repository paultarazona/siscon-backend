import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.login(dto);
    response.cookie('siscon_session', session.accessToken, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000, path: '/' });
    return { user: session.user };
  }

  @Public()
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('siscon_session', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' });
    return { message: 'Sesión cerrada.' };
  }
}
