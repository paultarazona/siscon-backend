import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EstadoLectura, EstadoMedidor, TipoIncidencia } from '@prisma/client';
import { LecturasService } from '../application/lecturas.service';
import { LECTURA_REPOSITORY, LecturaRepository } from '../domain/lectura.repository';

// Mock del repository
const mockRepository: jest.Mocked<LecturaRepository> = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findLatestByMedidor: jest.fn(),
  findMedidorById: jest.fn(),
  existsForMedidorPeriodo: jest.fn(),
  createWithIncidencia: jest.fn(),
  update: jest.fn(),
  deleteWithIncidencias: jest.fn(),
  prepareForRegistro: jest.fn(),
};

describe('LecturasService', () => {
  let service: LecturasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LecturasService,
        { provide: LECTURA_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<LecturasService>(LecturasService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('rechaza lectura regresiva', async () => {
      await expect(
        service.create(
          { medidorId: 1, periodoId: 1, lecturaAnterior: 200, lecturaActual: 150, fechaLectura: new Date() },
          1,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si el medidor no existe', async () => {
      mockRepository.findMedidorById.mockResolvedValue(null);

      await expect(
        service.create(
          { medidorId: 999, periodoId: 1, lecturaAnterior: 100, lecturaActual: 200, fechaLectura: new Date() },
          1,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza si el medidor no está ACTIVO', async () => {
      mockRepository.findMedidorById.mockResolvedValue({
        id: 1,
        numeroMedidor: 'M-001',
        suministroId: 1,
        estado: EstadoMedidor.RETIRADO,
      } as any);

      await expect(
        service.create(
          { medidorId: 1, periodoId: 1, lecturaAnterior: 100, lecturaActual: 200, fechaLectura: new Date() },
          1,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza lectura duplicada para mismo medidor y periodo', async () => {
      mockRepository.findMedidorById.mockResolvedValue({
        id: 1,
        numeroMedidor: 'M-001',
        suministroId: 1,
        estado: EstadoMedidor.ACTIVO,
      } as any);
      mockRepository.existsForMedidorPeriodo.mockResolvedValue(true);

      await expect(
        service.create(
          { medidorId: 1, periodoId: 1, lecturaAnterior: 100, lecturaActual: 200, fechaLectura: new Date() },
          1,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('crea lectura exitosamente con consumo normal', async () => {
      mockRepository.findMedidorById.mockResolvedValue({
        id: 1,
        numeroMedidor: 'M-001',
        suministroId: 1,
        estado: EstadoMedidor.ACTIVO,
      } as any);
      mockRepository.existsForMedidorPeriodo.mockResolvedValue(false);
      mockRepository.createWithIncidencia.mockResolvedValue({
        id: 1,
        lecturaAnterior: 100,
        lecturaActual: 200,
        consumoKwh: 100,
        estadoLectura: EstadoLectura.VALIDA,
      } as any);

      const result = await service.create(
        { medidorId: 1, periodoId: 1, lecturaAnterior: 100, lecturaActual: 200, fechaLectura: new Date() },
        1,
      );

      expect(mockRepository.createWithIncidencia).toHaveBeenCalledWith(
        expect.objectContaining({ medidorId: 1, periodoId: 1 }),
        1,
        100, // consumoKwh
        null, // sin incidencia (consumo normal)
      );
    });

    it('crea lectura con incidencia automática por consumo alto', async () => {
      mockRepository.findMedidorById.mockResolvedValue({
        id: 1,
        numeroMedidor: 'M-001',
        suministroId: 1,
        estado: EstadoMedidor.ACTIVO,
      } as any);
      mockRepository.existsForMedidorPeriodo.mockResolvedValue(false);
      mockRepository.createWithIncidencia.mockResolvedValue({ id: 1 } as any);

      await service.create(
        { medidorId: 1, periodoId: 1, lecturaAnterior: 0, lecturaActual: 1500, fechaLectura: new Date() },
        1,
      );

      expect(mockRepository.createWithIncidencia).toHaveBeenCalledWith(
        expect.anything(),
        1,
        1500,
        expect.objectContaining({
          tipoIncidencia: TipoIncidencia.CONSUMO_ALTO,
          nivel: 'MEDIO',
        }),
      );
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException si no existe', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('retorna la lectura si existe', async () => {
      const lectura = { id: 1, lecturaAnterior: 100, lecturaActual: 200 };
      mockRepository.findOne.mockResolvedValue(lectura as any);
      const result = await service.findOne(1);
      expect(result).toEqual(lectura);
    });
  });

  describe('parametros', () => {
    it('retorna parámetros del sistema', () => {
      const params = service.parametros();
      expect(params.estadosLectura).toContain(EstadoLectura.VALIDA);
      expect(params.estadosMedidor).toContain(EstadoMedidor.ACTIVO);
      expect(params.tiposIncidencia).toContain(TipoIncidencia.CONSUMO_ALTO);
      expect(params.paginacion).toEqual({ pageDefault: 1, limitDefault: 20, limitMax: 100 });
    });
  });

  describe('previsualizar', () => {
    it('calcula consumo y valida', () => {
      const result = service.previsualizar({ lecturaAnterior: 100, lecturaActual: 250 });
      expect(result.consumoKwh).toBe(150);
      expect(result.valida).toBe(true);
      expect(result.error).toBeNull();
    });

    it('detecta lectura regresiva', () => {
      const result = service.previsualizar({ lecturaAnterior: 200, lecturaActual: 150 });
      expect(result.valida).toBe(false);
      expect(result.error).toContain('lectura_actual no puede ser menor');
    });
  });

  describe('prepararRegistro', () => {
    it('lanza NotFoundException si el medidor no existe', async () => {
      mockRepository.prepareForRegistro.mockResolvedValue(null);
      await expect(service.prepararRegistro(999)).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si el medidor no está ACTIVO', async () => {
      mockRepository.prepareForRegistro.mockResolvedValue({
        medidor: { estado: EstadoMedidor.RETIRADO },
      } as any);
      await expect(service.prepararRegistro(1)).rejects.toThrow(BadRequestException);
    });

    it('retorna datos de preparación si el medidor está activo', async () => {
      const data = {
        suministro: { id: 1, codigoSuministro: 'SUM-001', tipoCliente: 'RESIDENCIAL', zona: 'Piura Centro', distrito: 'Piura' },
        medidor: { id: 1, numeroMedidor: 'M-001', estado: EstadoMedidor.ACTIVO },
        ultimaLectura: { lecturaActual: 100, periodo: '2024-07' },
        periodoSugerido: { anio: 2024, mes: 8 },
      };
      mockRepository.prepareForRegistro.mockResolvedValue(data as any);

      const result = await service.prepararRegistro(1);
      expect(result).toEqual(data);
    });
  });
});
