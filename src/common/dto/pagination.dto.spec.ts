import 'reflect-metadata';
import { buildPaginatedResponse } from './pagination.dto';

describe('buildPaginatedResponse', () => {
  it('construye respuesta con datos y metadata', () => {
    const data = [{ id: 1 }, { id: 2 }];
    const result = buildPaginatedResponse(data, 100, 1, 20);

    expect(result.data).toEqual(data);
    expect(result.meta).toEqual({
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5,
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it('hasPreviousPage es true en página intermedia', () => {
    const result = buildPaginatedResponse([], 100, 3, 20);
    expect(result.meta.hasPreviousPage).toBe(true);
    expect(result.meta.hasNextPage).toBe(true);
  });

  it('hasNextPage es false en última página', () => {
    const result = buildPaginatedResponse([], 100, 5, 20);
    expect(result.meta.hasNextPage).toBe(false);
    expect(result.meta.hasPreviousPage).toBe(true);
  });

  it('totalPages redondea hacia arriba', () => {
    const result = buildPaginatedResponse([], 10, 1, 3);
    expect(result.meta.totalPages).toBe(4);
  });

  it('totalPages es 1 cuando total es 0', () => {
    const result = buildPaginatedResponse([], 0, 1, 20);
    expect(result.meta.totalPages).toBe(0);
  });

  it('primera página no tiene previous', () => {
    const result = buildPaginatedResponse([], 50, 1, 10);
    expect(result.meta.hasPreviousPage).toBe(false);
    expect(result.meta.hasNextPage).toBe(true);
  });

  it('última página exacta no tiene next', () => {
    const result = buildPaginatedResponse([], 20, 1, 20);
    expect(result.meta.hasNextPage).toBe(false);
  });
});
