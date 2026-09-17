import { put, list } from '@vercel/blob';
import { HorariosData, CargaExcel, Horario, ordenDia } from './horarios-types';
import { horariosConfig } from './horarios-config';

const BLOB_PATH = horariosConfig.BLOB_PATH;

export async function guardarHorarios(horarios: Horario[], nombreArchivo: string): Promise<HorariosData> {
  const horariosOrdenados = [...horarios].sort((a, b) => {
    const ordenA = ordenDia(a.dia);
    const ordenB = ordenDia(b.dia);
    if (ordenA !== ordenB) return ordenA - ordenB;
    return a.docente.localeCompare(b.docente);
  });
  
  const carga: CargaExcel = {
    nombreArchivo, fecha: new Date().toISOString(), filasImportadas: horariosOrdenados.length, exito: true, mensaje: 'Éxito'
  };
  
  const dataExistente = await obtenerHorarios();
  const historial = dataExistente?.historialCargas || [];
  historial.unshift(carga);
  if (historial.length > 50) historial.length = 50;
  
  const data: HorariosData = { ultimaActualizacion: new Date().toISOString(), horarios: horariosOrdenados, historialCargas: historial };
  
  await put(BLOB_PATH, JSON.stringify(data), { access: 'public', contentType: 'application/json', addRandomSuffix: false });
  return data;
}

export async function obtenerHorarios(): Promise<HorariosData | null> {
  try {
    const { blobs } = await list({ prefix: 'horarios/' });
    const blob = blobs.find(b => b.pathname === BLOB_PATH);
    if (!blob) return null;
    const response = await fetch(blob.url, { cache: 'no-store' });
    return await response.json();
  } catch {
    return null;
  }
}