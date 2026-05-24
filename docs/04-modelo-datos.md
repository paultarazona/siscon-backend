# Modelo de datos

Entidades principales:
- `Usuario`: actor autenticado que registra lecturas o importaciones.
- `ZonaOperativa`: zona geográfica/operativa.
- `Suministro`: punto de suministro eléctrico.
- `Medidor`: equipo físico asociado a un suministro.
- `Periodo`: año y mes de lectura.
- `Lectura`: lectura mensual con consumo calculado.
- `Incidencia`: alerta u observación asociada a una lectura.
- `ImportacionDataset`: auditoría de carga de CSV.

Relaciones:
- `ZonaOperativa 1:N Suministro`
- `Suministro 1:N Medidor`
- `Medidor 1:N Lectura`
- `Periodo 1:N Lectura`
- `Usuario 1:N Lectura`
- `Lectura 1:N Incidencia`
