import { EstadoGeneral, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const users = [
  { email: 'admin@enosa.test', nombres: 'Administrador', apellidos: 'ENOSA', rol: Role.ADMIN, password: 'Admin123456' },
  { email: 'ana.operaciones@enosa.test', nombres: 'Ana', apellidos: 'Operaciones', rol: Role.ANALISTA, password: 'Test123456' },
  { email: 'luis.reportes@enosa.test', nombres: 'Luis', apellidos: 'Reportes', rol: Role.ANALISTA, password: 'Test123456' },
  { email: 'carlos.piura@enosa.test', nombres: 'Carlos', apellidos: 'Piura', rol: Role.OPERADOR, password: 'Test123456' },
  { email: 'maria.sullana@enosa.test', nombres: 'María', apellidos: 'Sullana', rol: Role.OPERADOR, password: 'Test123456' },
  { email: 'jorge.talara@enosa.test', nombres: 'Jorge', apellidos: 'Talara', rol: Role.OPERADOR, password: 'Test123456' },
  { email: 'diana.tumbes@enosa.test', nombres: 'Diana', apellidos: 'Tumbes', rol: Role.OPERADOR, password: 'Test123456' },
];

async function main() {
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const { password: _password, ...userData } = user;
    await prisma.usuario.upsert({
      where: { email: user.email },
      update: { nombres: user.nombres, apellidos: user.apellidos, rol: user.rol, estado: EstadoGeneral.ACTIVO, passwordHash },
      create: { ...userData, passwordHash, estado: EstadoGeneral.ACTIVO },
    });
  }
  console.log(`Seeded ${users.length} SISCON work users.`);
}

main().finally(() => prisma.$disconnect());
