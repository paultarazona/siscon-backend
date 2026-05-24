import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoLectura, EstadoMedidor, TipoIncidencia } from '@prisma/client';
import { CreateLecturaDto } from '../dto/create-lectura.dto';
import { LecturaFilterDto } from '../dto/lectura-filter.dto';
import { PrevisualizarLecturaDto } from '../dto/previsualizar-lectura.dto';
import { UpdateLecturaDto } from '../dto/update-lectura.dto';
import { calcularConsumoKwh, detectarIncidenciaPorConsumo, esLecturaRegresiva } from '../domain/lectura.rules';
import { LECTURA_REPOSITORY, LecturaRepository } from '../domain/lectura.repository';

@Injectable()
export class LecturasService {
  constructor(@Inject(LECTURA_REPOSITORY) private readonly lecturas: LecturaRepository) {}

  findAll(q: LecturaFilterDto) {
    return this.lecturas.findAll(q);
  }

  async findOne(id: number) {
    const row = await this.lecturas.findOne(id);
    if (!row) throw new NotFoundException('Lectura no encontrada');
    return row;
  }

  parametros() {
    return {
      estadosLectura: Object.values(EstadoLectura),
      estadosMedidor: Object.values(EstadoMedidor),
      tiposIncidencia: Object.values(TipoIncidencia),
      paginacion: { pageDefault: 1, limitDefault: 20, limitMax: 100 },
      reglas: {
        consumoAltoDesdeKwh: 1000,
        consumoAltoCriticoDesdeKwh: 2000,
        consumoBajoHastaKwh: 10,
      },
    };
  }

  async ultimaPorMedidor(medidorId: number) {
    const medidor = await this.lecturas.findMedidorById(medidorId);
    if (!medidor) throw new NotFoundException('Medidor no encontrado');
    return this.lecturas.findLatestByMedidor(medidorId);
  }

  previsualizar(dto: PrevisualizarLecturaDto) {
    const consumoKwh = calcularConsumoKwh(dto.lecturaAnterior, dto.lecturaActual);
    const lecturaRegresiva = esLecturaRegresiva(dto.lecturaAnterior, dto.lecturaActual);

    return {
      lecturaAnterior: dto.lecturaAnterior,
      lecturaActual: dto.lecturaActual,
      consumoKwh,
      valida: !lecturaRegresiva,
      error: lecturaRegresiva ? 'lectura_actual no puede ser menor que lectura_anterior' : null,
      incidenciaAutomatica: lecturaRegresiva ? null : detectarIncidenciaPorConsumo(consumoKwh),
    };
  }

  async create(dto: CreateLecturaDto, registradoPorId: number) {
    if (esLecturaRegresiva(dto.lecturaAnterior, dto.lecturaActual)) throw new BadRequestException('lectura_actual no puede ser menor que lectura_anterior');

    const medidor = await this.lecturas.findMedidorById(dto.medidorId);
    if (!medidor) throw new NotFoundException('Medidor no encontrado');
    if (medidor.estado !== EstadoMedidor.ACTIVO) throw new BadRequestException('El medidor debe estar ACTIVO para registrar lectura');

    const exists = await this.lecturas.existsForMedidorPeriodo(dto.medidorId, dto.periodoId);
    if (exists) throw new ConflictException('Ya existe lectura del medidor para el periodo');

    const consumoKwh = calcularConsumoKwh(dto.lecturaAnterior, dto.lecturaActual);
    const incidencia = detectarIncidenciaPorConsumo(consumoKwh);
    return this.lecturas.createWithIncidencia(dto, registradoPorId, consumoKwh, incidencia);
  }

  async update(id: number, dto: UpdateLecturaDto) {
    const current = await this.findOne(id);
    const anterior = dto.lecturaAnterior ?? Number(current.lecturaAnterior);
    const actual = dto.lecturaActual ?? Number(current.lecturaActual);

    if (esLecturaRegresiva(anterior, actual)) throw new BadRequestException('lectura_actual no puede ser menor que lectura_anterior');

    const consumoKwh = calcularConsumoKwh(anterior, actual);
    return this.lecturas.update(id, { ...dto, lecturaAnterior: anterior, lecturaActual: actual }, consumoKwh, EstadoLectura.CORREGIDA);
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.lecturas.deleteWithIncidencias(id);
  }
}
