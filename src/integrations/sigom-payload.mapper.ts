type SourceIncident = {
  id: number;
  tipoIncidencia: string;
  nivel: string;
  descripcion: string;
  fechaDeteccion: Date;
  lectura: {
    observacion: string | null;
    medidor: {
      id: number;
      numeroMedidor: string;
      suministro: {
        id: number;
        codigoSuministro: string;
        direccionReferencial: string | null;
        zona: { id: number; nombreZona: string };
      };
    };
  };
};

const PRIORITIES: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
  BAJO: 'LOW',
  MEDIO: 'MEDIUM',
  ALTO: 'HIGH',
  CRITICO: 'CRITICAL',
};

export function mapIncidentToSigom(incident: SourceIncident) {
  const { lectura } = incident;
  const { medidor } = lectura;
  const { suministro } = medidor;

  return {
    incident: {
      externalId: String(incident.id),
      code: `INC-${incident.id}`,
      type: incident.tipoIncidencia,
      level: PRIORITIES[incident.nivel] ?? 'MEDIUM',
      detectedAt: incident.fechaDeteccion.toISOString(),
      description: incident.descripcion,
      ...(lectura.observacion ? { readingObservation: lectura.observacion } : {}),
    },
    asset: {
      zone: { externalId: String(suministro.zona.id), name: suministro.zona.nombreZona },
      supply: { externalId: String(suministro.id), code: suministro.codigoSuministro },
      meter: { externalId: String(medidor.id), code: medidor.numeroMedidor },
      addressSnapshot: suministro.direccionReferencial ?? 'Dirección no registrada',
    },
  };
}
