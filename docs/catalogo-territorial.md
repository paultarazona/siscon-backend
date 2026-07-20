# Catálogo territorial del MVP

SISCON-ENOSA usa una cobertura territorial controlada para el MVP académico: los departamentos de **Piura** y **Tumbes**.

## Criterio de modelado

Departamento, provincia y distrito no se capturan como texto libre en la interfaz. Se cargan como data controlada mediante el seed de Prisma y el formulario consume esos valores para evitar errores de digitación, variantes de nombres y zonas operativas inconsistentes.

Para no romper el MVP actual, la información territorial se mantiene en `ZonaOperativa` con estos campos:

- `departamento`
- `provincia`
- `distrito`
- `nombreZona`
- `codigoZona`
- `estado`

Una normalización futura podría separar `Departamento`, `Provincia`, `Distrito` y `ZonaOperativa`, pero el MVP conserva el modelo operativo existente.

## Cobertura inicial

El seed inicializa:

- 2 departamentos: Piura y Tumbes.
- 11 provincias.
- 78 distritos.
- 78 zonas operativas base, una por distrito.

Cada zona base usa el nombre sugerido:

```txt
{Distrito} - {Provincia}
```

Y un código único con formato:

```txt
ZON-{DEP}-{PROV}-{NUMERO}
```

Ejemplos:

- `ZON-PIU-PIU-001`
- `ZON-TUM-TUM-001`

## Nota académica

Las zonas operativas se inicializan una por distrito para tener data completa y simple de validar durante el TPS.

En un sistema real, una zona operativa podría agrupar varios distritos o dividir un distrito en varias zonas, según la organización interna, rutas de lectura, cuadrillas, oficinas comerciales o criterios técnicos de la empresa.
