# Dashboard y reportes

El dashboard no debe cargar datos crudos masivos. Debe usar consultas agregadas (`SUM`, `COUNT`, `GROUP BY`) mediante Prisma, `groupBy` o SQL raw controlado.

Filtros soportados:
- `anioDesde`
- `anioHasta`
- `mes`
- `zonaId`
- `distrito`
- `tipoCliente`
- `estadoLectura`
- `tipoIncidencia`

Las lecturas y reportes sobre tablas grandes deben paginar o exportar en formatos controlados para no enviar millones de filas al frontend.
