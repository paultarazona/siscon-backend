type EnvConfig = Record<string, unknown>;

export function validateEnv(config: EnvConfig) {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'PORT', 'NODE_ENV'];
  const missing = required.filter((key) => !config[key]);
  if (missing.length) throw new Error(`Variables de entorno requeridas faltantes: ${missing.join(', ')}`);

  const port = Number(config.PORT);
  if (!Number.isInteger(port) || port <= 0) throw new Error('PORT debe ser un entero positivo');

  return {
    ...config,
    PORT: port,
  };
}
