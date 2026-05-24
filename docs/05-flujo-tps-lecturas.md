# Flujo TPS de lecturas

1. Operador busca suministro o medidor.
2. Sistema obtiene el medidor activo.
3. Sistema obtiene la última lectura disponible.
4. Operador ingresa la lectura actual.
5. Sistema valida datos y estado del medidor.
6. Sistema calcula `consumoKwh = lecturaActual - lecturaAnterior`.
7. Sistema guarda la lectura.
8. Sistema crea una incidencia si corresponde.
9. Dashboard y reportes consumen esa información como datos agregados o exportables.
