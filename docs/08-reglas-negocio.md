# Reglas de negocio

- `lecturaActual >= lecturaAnterior`.
- `consumoKwh = lecturaActual - lecturaAnterior`.
- No duplicar lectura por medidor y periodo.
- Solo registrar lectura si el medidor está `ACTIVO`.
- No borrar físicamente datos críticos; preferir estados cuando el modelo lo permita.
- Crear incidencia si el consumo es anómalo.
- Dashboard usa agregados, no filas crudas.
