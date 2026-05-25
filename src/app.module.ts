import { Module } from '@nestjs/common';
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
import { LecturasModule } from './lecturas/lecturas.module';
import { MedidoresModule } from './medidores/medidores.module';
import { PeriodosModule } from './periodos/periodos.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportesModule } from './reportes/reportes.module';
import { SuministrosModule } from './suministros/suministros.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ZonasModule } from './zonas/zonas.module';

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
    IncidenciasModule,
    ImportacionesModule,
    DashboardModule,
    ReportesModule,
    BusquedaModule,
  ],
})
export class AppModule {}
