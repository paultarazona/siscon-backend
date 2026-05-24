import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EstadoGeneral } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}
  async register(dto: RegisterDto) {
    const exists = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El email ya está registrado');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.usuario.create({ data: { nombres: dto.nombres, apellidos: dto.apellidos, email: dto.email, passwordHash, rol: dto.rol } });
    return this.sign(user);
  }
  async login(dto: LoginDto) {
    const user = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (!user || user.estado !== EstadoGeneral.ACTIVO) throw new UnauthorizedException('Credenciales inválidas');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    return this.sign(user);
  }
  private sign(user: { id: number; email: string; rol: string; nombres: string; apellidos: string }) {
    const payload = { sub: user.id, email: user.email, rol: user.rol };
    return { accessToken: this.jwt.sign(payload), user: { id: user.id, nombres: user.nombres, apellidos: user.apellidos, email: user.email, rol: user.rol } };
  }
}
