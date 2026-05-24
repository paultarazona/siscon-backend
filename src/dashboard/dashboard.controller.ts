import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('resumen')
  resumen(@Query() q: DashboardFilterDto) {
    return this.service.resumen(q);
  }

  @Get('consumo-mensual')
  consumoMensual(@Query() q: DashboardFilterDto) {
    return this.service.consumoMensual(q);
  }

  @Get('comparativo-anual')
  comparativoAnual(@Query() q: DashboardFilterDto) {
    return this.service.comparativoAnual(q);
  }

  @Get('consumo-por-zona')
  consumoPorZona(@Query() q: DashboardFilterDto) {
    return this.service.consumoPorZona(q);
  }

  @Get('consumo-por-tipo-cliente')
  consumoPorTipoCliente(@Query() q: DashboardFilterDto) {
    return this.service.consumoPorTipoCliente(q);
  }

  @Get('incidencias-por-tipo')
  incidenciasPorTipo(@Query() q: DashboardFilterDto) {
    return this.service.incidenciasPorTipo(q);
  }

  @Get('top-suministros')
  topSuministros(@Query() q: DashboardFilterDto) {
    return this.service.topSuministros(q);
  }
}
