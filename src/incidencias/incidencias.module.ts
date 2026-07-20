import { Module } from '@nestjs/common';
import { IntegrationsModule } from '../integrations/integrations.module';
import { PrismaService } from '../prisma/prisma.service';
import { IncidenciasController } from './incidencias.controller';
import { IncidenciasService } from './incidencias.service';

@Module({
  imports: [IntegrationsModule],
  controllers: [IncidenciasController],
  providers: [IncidenciasService, PrismaService],
})
export class IncidenciasModule {}
