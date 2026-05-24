import { BadRequestException, Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { LecturasService } from '../lecturas/lecturas.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ImportacionesService {
  constructor(private prisma: PrismaService, private lecturas: LecturasService) {}
  findAll(){return this.prisma.importacionDataset.findMany({include:{importadoPor:{select:{id:true,nombres:true,apellidos:true,email:true}}},orderBy:{fechaImportacion:'desc'}});}
  async importarCsv(file: Express.Multer.File, userId: number) {
    if (!file) throw new BadRequestException('Debe enviar un archivo CSV en el campo file');
    const rows = parse(file.buffer.toString('utf8'), { columns: true, skip_empty_lines: true, trim: true }) as Record<string,string>[];
    let validos = 0, errores = 0;
    for (const row of rows) {
      try {
        const numeroMedidor = row.numero_medidor ?? row.numeroMedidor;
        const lecturaAnterior = row.lectura_anterior ?? row.lecturaAnterior;
        const lecturaActual = row.lectura_actual ?? row.lecturaActual;
        const fechaLectura = row.fecha_lectura ?? row.fechaLectura;
        const medidor = await this.prisma.medidor.findUnique({ where: { numeroMedidor } });
        const periodo = await this.prisma.periodo.findUnique({ where: { anio_mes: { anio: Number(row.anio), mes: Number(row.mes) } } });
        if (!medidor || !periodo) throw new Error('Medidor o periodo no encontrado');
        await this.lecturas.create({ medidorId: medidor.id, periodoId: periodo.id, lecturaAnterior: Number(lecturaAnterior), lecturaActual: Number(lecturaActual), fechaLectura: fechaLectura ? new Date(fechaLectura) : new Date(), observacion: row.observacion }, userId);
        validos++;
      } catch { errores++; }
    }
    return this.prisma.importacionDataset.create({ data: { nombreArchivo: file.originalname, totalRegistros: rows.length, registrosValidos: validos, registrosError: errores, importadoPorId: userId, estado: errores ? 'PROCESADO_CON_ERRORES' : 'PROCESADO' } });
  }
}
