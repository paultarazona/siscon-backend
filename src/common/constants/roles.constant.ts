import { Role } from '@prisma/client';

export const ROLES = {
  ADMIN: Role.ADMIN,
  OPERADOR: Role.OPERADOR,
  ANALISTA: Role.ANALISTA,
} as const;
