import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportesService } from './reportes.service';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly service: ReportesService) {}

  @Get('lecturas/csv')
  async lecturasCsv(@Res() res: Response) {
    const csv = await this.service.lecturasCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=lecturas.csv');
    return res.send(csv);
  }

  @Get('consumo/excel')
  async consumoExcel(@Res() res: Response) {
    const buffer = await this.service.consumoExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=consumo.xlsx');
    return res.send(buffer);
  }
}
