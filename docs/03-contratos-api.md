# Contratos API

## Documentación interactiva

Swagger UI está disponible en:

```txt
GET /api/docs
```

Flujo recomendado para probar:

1. Ejecutar `POST /auth/login` con el usuario seed.
2. Copiar el `accessToken` retornado.
3. Presionar **Authorize** en Swagger.
4. Pegar el token como Bearer Token.
5. Probar los endpoints protegidos.

Usuario seed:

```json
{
  "email": "admin@siscon-enosa.local",
  "password": "admin123"
}
```

Nota: salvo `POST /auth/login` y `POST /auth/register`, los endpoints requieren JWT.

## Auth
- `POST /auth/login`
- `POST /auth/register`

## Usuarios
- `GET /usuarios`
- `POST /usuarios`
- `GET /usuarios/:id`
- `PATCH /usuarios/:id`
- `DELETE /usuarios/:id`

## Zonas
- `GET /zonas`
- `POST /zonas`
- `GET /zonas/:id`
- `PATCH /zonas/:id`
- `DELETE /zonas/:id`

## Suministros
- `GET /suministros`
- `POST /suministros`
- `GET /suministros/:id`
- `PATCH /suministros/:id`
- `DELETE /suministros/:id`

## Medidores
- `GET /medidores`
- `POST /medidores`
- `GET /medidores/:id`
- `PATCH /medidores/:id`
- `DELETE /medidores/:id`

## Periodos
- `GET /periodos`
- `POST /periodos`

## Lecturas
- `GET /lecturas`
- `GET /lecturas/parametros`
- `GET /lecturas/ultima?medidorId=1`
- `POST /lecturas/previsualizar`
- `POST /lecturas`
- `GET /lecturas/:id`
- `PATCH /lecturas/:id`
- `DELETE /lecturas/:id`

### Contratos útiles para frontend de lecturas

#### Listado paginado

```txt
GET /lecturas?page=1&limit=20&anio=2024&mes=1&zonaId=1&suministroId=1&medidorId=1&estadoLectura=VALIDA
```

Todos los filtros son opcionales. `limit` máximo: `100`.

#### Parámetros para combos y reglas visuales

```txt
GET /lecturas/parametros
```

Devuelve estados de lectura, estados de medidor, tipos de incidencia, paginación y umbrales de consumo.

#### Última lectura de un medidor

```txt
GET /lecturas/ultima?medidorId=1
```

Sirve para autocompletar `lecturaAnterior` en el formulario de nueva lectura.

#### Previsualizar consumo antes de guardar

```txt
POST /lecturas/previsualizar
Content-Type: application/json
```

Body:

```json
{
  "lecturaAnterior": 1000,
  "lecturaActual": 1160
}
```

Respuesta esperada:

```json
{
  "lecturaAnterior": 1000,
  "lecturaActual": 1160,
  "consumoKwh": 160,
  "valida": true,
  "error": null,
  "incidenciaAutomatica": null
}
```

#### Crear lectura

```txt
POST /lecturas
Content-Type: application/json
Authorization: Bearer <token>
```

Body:

```json
{
  "medidorId": 1,
  "periodoId": 61,
  "lecturaAnterior": 1000,
  "lecturaActual": 1160,
  "fechaLectura": "2025-01-20T00:00:00.000Z",
  "observacion": "Lectura tomada en campo"
}
```

## Dashboard
- `GET /dashboard/resumen`
- `GET /dashboard/consumo-mensual`
- `GET /dashboard/comparativo-anual`
- `GET /dashboard/consumo-por-zona`
- `GET /dashboard/consumo-por-tipo-cliente`
- `GET /dashboard/incidencias-por-tipo`
- `GET /dashboard/top-suministros`

## Importaciones
- `POST /importaciones/csv`
- `GET /importaciones`

## Reportes
- `GET /reportes/lecturas/csv`
- `GET /reportes/consumo/excel`

Nota de compatibilidad: la antigua ruta `/users` fue normalizada a `/usuarios`.
