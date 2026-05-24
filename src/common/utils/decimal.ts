import { Prisma } from '@prisma/client';
export const toDecimal = (value: number | string | Prisma.Decimal) => new Prisma.Decimal(value);
