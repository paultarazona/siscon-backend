import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ZonasController } from './zonas.controller';
import { ZonasService } from './zonas.service';
@Module({ controllers: [ZonasController], providers: [ZonasService, PrismaService] }) export class ZonasModule {}
