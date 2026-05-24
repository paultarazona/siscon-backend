import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { validateEnv } from './config/env.validation';
import jwtConfig from './config/jwt.config';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { DashboardModule } from './dashboard/dashboard.module';
import { ImportacionesModule } from './importaciones/importaciones.module';
import { IncidenciasModule } from './incidencias/incidencias.module';
import { LecturasModule } from './lecturas/lecturas.module';
import { MedidoresModule } from './medidores/medidores.module';
import { PeriodosModule } from './periodos/periodos.module';
import { PrismaService } from './prisma/prisma.service';
import { ReportesModule } from './reportes/reportes.module';
import { SuministrosModule } from './suministros/suministros.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ZonasModule } from './zonas/zonas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig, databaseConfig, jwtConfig], validate: validateEnv }),
    AuthModule,
    UsuariosModule,
    ZonasModule,
    SuministrosModule,
    MedidoresModule,
    PeriodosModule,
    LecturasModule,
    IncidenciasModule,
    ImportacionesModule,
    DashboardModule,
    ReportesModule,
  ],
  providers: [PrismaService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
