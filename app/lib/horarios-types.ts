export const ORDEN_DIAS: Record<string, number> = {
  "LUNES": 1, "MARTES": 2, "MIERCOLES": 3, "MIÉRCOLES": 3,
  "JUEVES": 4, "VIERNES": 5, "SABADO": 6, "SÁBADO": 6, "DOMINGO": 7,
};

export interface Horario {
  id?: number;
  dia: string;
  horario: string;
  docente: string;
  materia: string;
  aula: string;
}

export interface CargaExcel {
  nombreArchivo: string;
  fecha: string;
  filasImportadas: number;
  exito: boolean;
  mensaje: string;
}

export interface HorariosData {
  ultimaActualizacion: string;
  horarios: Horario[];
  historialCargas: CargaExcel[];
}

export function ordenDia(dia: string): number {
  return ORDEN_DIAS[dia.trim().toUpperCase()] || 99;
}