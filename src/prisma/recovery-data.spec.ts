import { buildRecoveryPeriods, READINGS_PER_METER, RECOVERY_SUPPLIES } from '../../prisma/recovery-data';

describe('buildRecoveryPeriods', () => {
  it('crea los 48 períodos mensuales entre 2022 y 2025', () => {
    const periods = buildRecoveryPeriods();

    expect(periods).toHaveLength(48);
    expect(periods[0]).toMatchObject({ anio: 2022, mes: 1 });
    expect(periods.at(-1)).toMatchObject({ anio: 2025, mes: 12 });
  });

  it('define una cobertura mensual completa para mil suministros', () => {
    expect(RECOVERY_SUPPLIES).toBe(1000);
    expect(READINGS_PER_METER).toBe(48);
    expect(RECOVERY_SUPPLIES * READINGS_PER_METER).toBe(48000);
  });
});
