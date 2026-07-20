# Seed de Datos Operativos — SISCON-ENOSA

## Propósito

Este seed genera data sintética, académica y coherente para probar el TPS SISCON-ENOSA en el área de Operaciones / Medición Eléctrica.

## Cobertura

- **Departamentos:** Piura y Tumbes (MVP académico).
- **Períodos:** 36 meses (enero 2024 — diciembre 2026).
- **Suministros:** 1000.
- **Medidores:** ~1041 (incluye medidores retirados para historial).
- **Lecturas:** ~34 740.
- **Incidencias:** ~1 393.

## Ejecución

```bash
# Limpia datos existentes
npm run db:clean

# Carga seed operativo
npm run db:seed

# O en un solo comando
npm run db:fresh
```

## Distribución de suministros

| Tipo de cliente | Cantidad | Porcentaje |
|-----------------|----------|------------|
| RESIDENCIAL     | ~700     | 70%        |
| COMERCIAL       | ~200     | 20%        |
| INDUSTRIAL      | ~50      | 5%         |
| PÚBLICO         | ~50      | 5%         |

## Distribución territorial

Las zonas operativas siguen una concentración ponderada:

- **Alta:** Piura, Sullana, Talara, Tumbes, Pariñas, Paita.
- **Media:** Catacaos, Tambogrande, Chulucanas, Sechura, Máncora.
- **Baja:** Ayabaca, Huancabamba, Canchaque, Sondorillo, Casitas.

## Modelado de consumo

### Perfiles base por tipo de cliente

| Tipo            | Rango kWh mensual |
|-----------------|-------------------|
| Residencial     | 40 — 450          |
| Comercial       | 250 — 3 500       |
| Industrial      | 3 000 — 50 000    |
| Público         | 300 — 6 000       |

### Estacionalidad (Piura / Tumbes)

- **Enero — Marzo:** +15% a +35% (verano / mayor demanda).
- **Julio — Agosto:** -5% a -12%.
- **Zonas costeras/turísticas:** pico adicional en verano para comercial.

### Crecimiento anual

| Año | Factor |
|-----|--------|
| 2024 | 1.00 |
| 2025 | 1.06 |
| 2026 | 1.12 |

Esto permite que el dashboard muestre tendencia creciente de demanda.

## Estados de lectura

| Estado      | Frecuencia aprox. |
|-------------|-------------------|
| VALIDA      | ~90%              |
| OBSERVADA   | ~7%               |
| CORREGIDA   | ~2%               |
| ANULADA     | ~1%               |

## Incidencias

Se generan automáticamente para lecturas anómalas:

- **CONSUMO_ALTO:** cuando el consumo supera el perfil base × 1.8 o forzado al ~1.5%.
- **CONSUMO_BAJO:** cuando el consumo cae por debajo del perfil base × 0.5 o forzado al ~1.5%.
- **SIN_LECTURA:** consumo = 0, forzado al ~1.0%.
- **LECTURA_INVALIDA:** forzado al ~1.0%.
- **MEDIDOR_OBSERVADO:** cuando el medidor está EN_REVISION.

Estados de incidencia:
- PENDIENTE: ~40%
- EN_REVISION: ~30%
- CERRADA: ~30%

## Usuarios del sistema

| Email | Rol |
|-------|-----|
| admin@enosa.test | ADMIN |
| analista.operaciones@enosa.test | ANALISTA |
| analista.reportes@enosa.test | ANALISTA |
| operador.piura@enosa.test | OPERADOR |
| operador.sullana@enosa.test | OPERADOR |
| operador.talara@enosa.test | OPERADOR |
| operador.tumbes@enosa.test | OPERADOR |

## Notas importantes

- La data es **sintética y académica**.
- No contiene datos personales reales.
- Los consumos varían mes a mes con variación aleatoria controlada.
- El seed usa un generador pseudoaleatorio determinístico (`seed = 20262026`) para reproducibilidad.
- El objetivo principal es alimentar **dashboard**, **reportes** e **incidencias** para toma de decisiones.
- En un sistema real, una zona operativa podría agrupar varios distritos; aquí se modeló una zona por distrito para fines del TPS.
