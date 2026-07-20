import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BusquedaModule } from './busqueda/busqueda.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { validateEnv } from './config/env.validation';
import jwtConfig from './config/jwt.config';
import { DashboardModule } from './dashboard/dashboard.module';
import { ImportacionesModule } from './importaciones/importaciones.module';
import { IncidenciasModule } from './incidencias/incidencias.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { LecturasModule } from './lecturas/lecturas.module';
import { MedidoresModule } from './medidores/medidores.module';
import { PeriodosModule } from './periodos/periodos.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportesModule } from './reportes/reportes.module';
import { SuministrosModule } from './suministros/suministros.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ZonasModule } from './zonas/zonas.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig, databaseConfig, jwtConfig], validate: validateEnv }),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    ZonasModule,
    SuministrosModule,
    MedidoresModule,
    PeriodosModule,
    LecturasModule,
    IntegrationsModule,
    IncidenciasModule,
    ImportacionesModule,
    DashboardModule,
    ReportesModule,
    BusquedaModule,
  ],
  providers: [
    JwtAuthGuard,
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
  ],
})
export class AppModule {}
