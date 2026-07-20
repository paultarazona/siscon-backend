import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { EstadoGeneral } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

export function extractSessionCookie(request: { headers?: { cookie?: string } }) {
  return request.headers?.cookie?.split('; ').find((cookie) => cookie.startsWith('siscon_session='))?.slice('siscon_session='.length) ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractSessionCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret',
    });
  }
  async validate(payload: { sub: number; email: string; rol: string }) {
    const user = await this.prisma.usuario.findUnique({ where: { id: payload.sub } });
    if (!user || user.estado !== EstadoGeneral.ACTIVO) throw new UnauthorizedException();
    return { id: user.id, email: user.email, rol: user.rol };
  }
}
