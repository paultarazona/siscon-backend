import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LecturasService } from './application/lecturas.service';
import { LECTURA_REPOSITORY } from './domain/lectura.repository';
import { PrismaLecturaRepository } from './infrastructure/prisma-lectura.repository';
import { LecturasController } from './presentation/lecturas.controller';

@Module({
  controllers: [LecturasController],
  providers: [
    LecturasService,
    PrismaService,
    { provide: LECTURA_REPOSITORY, useClass: PrismaLecturaRepository },
  ],
  exports: [LecturasService],
})
export class LecturasModule {}
