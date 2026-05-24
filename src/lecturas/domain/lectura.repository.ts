import { EstadoLectura, Medidor } from '@prisma/client';
import { CreateLecturaDto } from '../dto/create-lectura.dto';
import { LecturaFilterDto } from '../dto/lectura-filter.dto';
import { UpdateLecturaDto } from '../dto/update-lectura.dto';
import { IncidenciaAutomatica } from './lectura.rules';

export const LECTURA_REPOSITORY = Symbol('LECTURA_REPOSITORY');

export type LecturaConDetalle = Record<string, any> & {
  id: number;
  lecturaAnterior: unknown;
  lecturaActual: unknown;
};

export type PaginatedLecturas = {
  data: LecturaConDetalle[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export interface LecturaRepository {
  findAll(q: LecturaFilterDto): Promise<PaginatedLecturas>;
  findOne(id: number): Promise<LecturaConDetalle | null>;
  findLatestByMedidor(medidorId: number): Promise<LecturaConDetalle | null>;
  findMedidorById(id: number): Promise<Medidor | null>;
  existsForMedidorPeriodo(medidorId: number, periodoId: number): Promise<boolean>;
  createWithIncidencia(dto: CreateLecturaDto, registradoPorId: number, consumoKwh: number, incidencia: IncidenciaAutomatica | null): Promise<LecturaConDetalle | null>;
  update(id: number, dto: UpdateLecturaDto, consumoKwh: number, estadoLectura: EstadoLectura): Promise<LecturaConDetalle>;
  deleteWithIncidencias(id: number): Promise<LecturaConDetalle>;
}
