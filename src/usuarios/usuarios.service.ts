import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.usuario.findMany({
      select: { id: true, nombres: true, apellidos: true, email: true, rol: true, estado: true, createdAt: true },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nombres: true, apellidos: true, email: true, rol: true, estado: true, createdAt: true },
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  create() {
    return { message: 'Use POST /auth/register para crear usuarios con contraseña.' };
  }

  update(id: number) {
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.usuario.update({ where: { id }, data: { estado: 'INACTIVO' }, select: { id: true, estado: true } });
  }
}
