import { Module } from '@nestjs/common';
import { BusquedaController } from './busqueda.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BusquedaController],
})
export class BusquedaModule {}
