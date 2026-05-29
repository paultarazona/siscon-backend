# SISCON-ENOSA Backend

API REST del TPS académico **SISCON-ENOSA** para registrar lecturas eléctricas mensuales por suministro/medidor, calcular consumo kWh y alimentar dashboard/reportes operativos.

## Stack

- NestJS + TypeScript
- Prisma ORM
- PostgreSQL
- JWT Auth
- `class-validator` / DTOs

## Arquitectura

Arquitectura modular NestJS: los controllers reciben requests y delegan; los services contienen reglas de negocio; `PrismaService` centraliza acceso a PostgreSQL. El módulo central del dominio es `lecturas`.

Módulos principales: `auth`, `usuarios`, `zonas`, `suministros`, `medidores`, `periodos`, `lecturas`, `incidencias`, `importaciones`, `dashboard`, `reportes`, `common`, `config`, `prisma`.

## Instalación

```bash
npm install
cp .env.example .env
```

Variables requeridas:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/siscon_enosa"
JWT_SECRET="change-me"
JWT_EXPIRES_IN="8h"
PORT=3000
NODE_ENV="development"
```

## Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Usuario seed:

- email: `admin@siscon-enosa.local`
- password: `admin123`

## Correr backend

```bash
npm run start:dev
```

## Documentación interactiva

Con el backend corriendo, abrir Swagger UI en:

```txt
http://localhost:3000/api/docs
```

Primero hacer login en `POST /auth/login`, copiar `accessToken` y usar el botón **Authorize** con Bearer Token para probar endpoints protegidos.

## Endpoints principales

- Auth: `POST /auth/login`, `POST /auth/register`
- Usuarios: `GET/POST /usuarios`, `GET/PATCH/DELETE /usuarios/:id`
- Zonas: `GET/POST /zonas`, `GET/PATCH/DELETE /zonas/:id`
- Suministros: `GET/POST /suministros`, `GET/PATCH/DELETE /suministros/:id`
- Medidores: `GET/POST /medidores`, `GET/PATCH/DELETE /medidores/:id`
- Periodos: `GET/POST /periodos`
- Lecturas: `GET/POST /lecturas`, `GET/PATCH/DELETE /lecturas/:id`, `GET /lecturas/parametros`, `GET /lecturas/ultima?medidorId=1`, `POST /lecturas/previsualizar`
- Dashboard: `GET /dashboard/resumen`, `GET /dashboard/consumo-mensual`, `GET /dashboard/comparativo-anual`, `GET /dashboard/consumo-por-zona`, `GET /dashboard/consumo-por-tipo-cliente`, `GET /dashboard/incidencias-por-tipo`, `GET /dashboard/top-suministros`
- Importaciones: `POST /importaciones/csv`, `GET /importaciones`
- Reportes: `GET /reportes/lecturas/csv`, `GET /reportes/consumo/excel`

Nota: `/users` fue normalizado a `/usuarios`.

## TPS de lecturas

`POST /lecturas` registra una lectura mensual y aplica reglas:

- `lecturaActual >= lecturaAnterior`
- `consumoKwh = lecturaActual - lecturaAnterior`
- no duplicar lectura por medidor y periodo
- solo registrar si el medidor está `ACTIVO`
- crear incidencia automática ante consumos anómalos

`GET /lecturas` está paginado (`page`, `limit`) para evitar enviar tablas grandes completas al frontend.

Endpoints auxiliares para frontend:

- `GET /lecturas/parametros`: enums y reglas para combos/validaciones de UI.
- `GET /lecturas/ultima?medidorId=1`: última lectura del medidor para autocompletar lectura anterior.
- `POST /lecturas/previsualizar`: calcula consumo e incidencia automática antes de guardar.

## Importación CSV

Endpoint: `POST /importaciones/csv` con `multipart/form-data`, campo `file`.

Columnas esperadas:

```csv
codigo_suministro,numero_medidor,zona,tipo_cliente,anio,mes,lectura_anterior,lectura_actual,fecha_lectura
SUM-000001,MED-000001,Zona Centro,RESIDENCIAL,2024,1,1000,1120,2024-01-20
```

## Base de datos desde SQL (sin Node.js/Prisma)

Si no tenés Node.js ni Prisma, podés crear la base de datos directamente con los scripts SQL provistos en `sql/`:

```bash
# 1. Crear la base de datos
psql -U postgres -c "CREATE DATABASE enosa;"

# 2. Crear tablas e índices
psql -U postgres -d enosa -f sql/01-schema.sql

# 3. Insertar datos de prueba (zonas, suministros, lecturas, incidencias)
psql -U postgres -d enosa -f sql/02-seed.sql
```

Usuarios de prueba incluidos en el seed:

| Rol | Email | Password |
|-----|-------|----------|
| ADMIN | `admin@enosa.test` | `Admin123!` |
| ANALISTA | `analista.operaciones@enosa.test` | `Admin123!` |
| OPERADOR | `operador.piura@enosa.test` | `Admin123!` |

> Los passwords tienen hash bcrypt; para autenticarse usar los valores en texto plano de la tabla.

## Documentación técnica

Ver `/docs` para arquitectura, convenciones, contratos API, modelo de datos, flujo de lecturas, dashboard/reportes, importación y reglas de negocio.
