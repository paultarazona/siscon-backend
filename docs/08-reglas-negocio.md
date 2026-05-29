# Reglas de negocio

- `lecturaActual >= lecturaAnterior`.
- `consumoKwh = lecturaActual - lecturaAnterior`.
- `POST /lecturas` requiere `lecturaAnterior` como número; el backend no lo infiere automáticamente.
- Para la primera lectura de un medidor, el frontend debe enviar `lecturaAnterior: 0` cuando no exista lectura previa.
- `GET /lecturas/ultima?medidorId=X` devuelve `null` si el medidor existe pero no tiene lecturas registradas.
- No duplicar lectura por medidor y periodo.
- Solo registrar lectura si el medidor está `ACTIVO`.
- No borrar físicamente datos críticos; preferir estados cuando el modelo lo permita.
- Crear incidencia si el consumo es anómalo.
- Dashboard usa agregados, no filas crudas.
