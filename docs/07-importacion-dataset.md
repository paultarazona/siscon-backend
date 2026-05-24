# Importación de dataset

El endpoint `POST /importaciones/csv` espera un archivo CSV en el campo `file`.

Columnas requeridas:
- `codigo_suministro`
- `numero_medidor`
- `zona`
- `tipo_cliente`
- `anio`
- `mes`
- `lectura_anterior`
- `lectura_actual`
- `fecha_lectura`

El servicio conserva compatibilidad temporal con nombres camelCase usados previamente (`numeroMedidor`, `lecturaAnterior`, `lecturaActual`, `fechaLectura`).
