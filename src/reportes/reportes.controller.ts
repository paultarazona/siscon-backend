import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReporteFilterDto } from './dto/reporte-filter.dto';
import { ReportesService } from './reportes.service';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly service: ReportesService) {}

  @Get('lecturas/csv')
  async lecturasCsv(@Query() q: ReporteFilterDto, @Res() res: Response) {
    const csv = await this.service.lecturasCsv(q);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=lecturas.csv');
    return res.send(csv);
  }

  @Get('consumo/excel')
  async consumoExcel(@Query() q: ReporteFilterDto, @Res() res: Response) {
    const buffer = await this.service.consumoExcel(q);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=consumo.xlsx');
    return res.send(buffer);
  }
}
