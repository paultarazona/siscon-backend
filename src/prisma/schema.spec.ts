import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Prisma schema', () => {
  it('maps Incidencia.estado to the PostgreSQL EstadoIncidencia enum', () => {
    const schema = readFileSync(join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');

    expect(schema).toContain('enum EstadoIncidencia {');
    expect(schema).toContain('  PENDIENTE');
    expect(schema).toContain('  DERIVADA_A_SIGOM');
    expect(schema).toContain('  RESUELTA');
    expect(schema).toMatch(/estado\s+EstadoIncidencia\s+@default\(PENDIENTE\)/);
  });

  it('migra los estados históricos antes de convertirlos al enum', () => {
    const migration = readFileSync(
      join(process.cwd(), 'prisma', 'migrations', '20260720000000_incidencia_estado_enum', 'migration.sql'),
      'utf8',
    );

    expect(migration).toContain("WHEN 'EN_REVISION' THEN 'PENDIENTE'");
    expect(migration).toContain("WHEN 'CERRADA' THEN 'RESUELTA'");
  });
});
