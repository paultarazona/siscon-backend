# Arquitectura backend SISCON-ENOSA

El backend usa una arquitectura modular de NestJS. Cada módulo agrupa su controlador, servicio, DTOs y módulo Nest para mantener responsabilidades claras y evitar lógica de negocio dispersa.

Flujo principal: React consume endpoints REST del backend NestJS; los controllers reciben la request y delegan al service; los services aplican reglas de negocio y usan PrismaService; Prisma ejecuta consultas sobre PostgreSQL.

Responsabilidades:
- `auth`: autenticación JWT y registro/login.
- `usuarios`: consulta y gestión administrativa de usuarios.
- `zonas`: zonas operativas.
- `suministros`: suministros asociados a zonas.
- `medidores`: medidores asociados a suministros.
- `periodos`: periodos mensuales de lectura.
- `lecturas`: registro, validación y cálculo de consumo kWh. Es el módulo central del TPS.
- `incidencias`: observaciones derivadas de lecturas.
- `importaciones`: carga de dataset CSV.
- `dashboard`: métricas agregadas para visualización.
- `reportes`: exportación CSV/Excel.
- `common`: guards, decorators, filtros, interceptores, pipes y utilidades transversales.
- `config`: configuración y validación de entorno.
