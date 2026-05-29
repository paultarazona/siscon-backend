import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EstadoGeneral, TipoCliente } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SuministrosService } from './suministros.service';

describe('SuministrosService', () => {
  let service: SuministrosService;

  const mockPrisma = {
    suministro: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuministrosService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SuministrosService>(SuministrosService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('devuelve suministros paginados por defecto', async () => {
      const data = [{ id: 1, codigoSuministro: 'SUM-001' }];
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([data, 1]);

      const result = await service.findAll({});

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.data).toEqual(data);
      expect(result.meta.total).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
    });

    it('devuelve paginación con hasNextPage', async () => {
      const data = [{ id: 1 }];
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([data, 50]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.totalPages).toBe(3);
    });

    it('devuelve pagina vacía cuando no hay datos', async () => {
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.hasNextPage).toBe(false);
    });
  });

  describe('findOne', () => {
    it('lanza NotFoundException si no existe', async () => {
      mockPrisma.suministro.findUnique.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('retorna suministro si existe', async () => {
      const suministro = { id: 1, codigoSuministro: 'SUM-001' };
      mockPrisma.suministro.findUnique.mockResolvedValue(suministro);
      const result = await service.findOne(1);
      expect(result).toEqual(suministro);
    });
  });

  describe('create', () => {
    it('crea suministro', async () => {
      const dto = { codigoSuministro: 'SUM-NEW', tipoCliente: TipoCliente.RESIDENCIAL, zonaId: 1 };
      mockPrisma.suministro.create.mockResolvedValue({ id: 99, ...dto });

      const result = await service.create(dto);

      expect(mockPrisma.suministro.create).toHaveBeenCalledWith({ data: dto });
      expect(result.id).toBe(99);
    });
  });

  describe('remove', () => {
    it('elimina suministro existente', async () => {
      mockPrisma.suministro.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.suministro.delete.mockResolvedValue({ id: 1 });

      await service.remove(1);

      expect(mockPrisma.suministro.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('lanza NotFoundException si no existe', async () => {
      mockPrisma.suministro.findUnique.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
