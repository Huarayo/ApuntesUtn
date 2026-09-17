import * as XLSX from 'xlsx';
import { Horario } from './horarios-types';

const COLUMNAS_ESPERADAS = ["DIA", "HORARIO", "DOCENTE", "MATERIA", "AULA"];

// Tipamos el texto para aceptar lo que viene de una celda de Excel
function normalizarTexto(texto: string | number | null | undefined): string {
  if (texto == null) return "";
  return String(texto).trim().toUpperCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function mapearColumnas(columnasExcel: string[]): Record<string, string> {
  const mapeo: Record<string, string> = {};
  const normalizadas: Record<string, string> = {};
  columnasExcel.forEach(col => { normalizadas[normalizarTexto(col)] = col; });
  COLUMNAS_ESPERADAS.forEach(esperada => {
    if (normalizadas[esperada]) mapeo[esperada] = normalizadas[esperada];
  });
  return mapeo;
}

export class ExcelInvalidoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExcelInvalidoError';
  }
}

export function procesarExcel(buffer: ArrayBuffer, nombreArchivo: string): { horarios: Horario[]; filasImportadas: number; } {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Tipamos la fila del Excel: un objeto con claves string y valores string o número
    const data = XLSX.utils.sheet_to_json<Record<string, string | number>>(firstSheet, { defval: '' });
    
    if (data.length === 0) throw new ExcelInvalidoError("El Excel está vacío.");
    
    const columnasReales = Object.keys(data[0]);
    const mapeo = mapearColumnas(columnasReales);
    const faltantes = COLUMNAS_ESPERADAS.filter(col => !mapeo[col]);
    
    if (faltantes.length > 0) throw new ExcelInvalidoError(`Faltan columnas: ${faltantes.join(", ")}`);
    
    const filasValidas: Horario[] = [];
    for (const row of data) {
      const dia = String(row[mapeo["DIA"]] || "").trim();
      const docente = String(row[mapeo["DOCENTE"]] || "").trim();
      if (!dia || dia.toLowerCase() === 'nan') continue;
      if (!docente || docente.toLowerCase() === 'nan') continue;
      
      filasValidas.push({
        dia,
        horario: String(row[mapeo["HORARIO"]] || "").trim(),
        docente,
        materia: String(row[mapeo["MATERIA"]] || "").trim(),
        aula: String(row[mapeo["AULA"]] || "").trim(),
      });
    }
    
    if (filasValidas.length === 0) throw new ExcelInvalidoError("No hay filas válidas.");
    return { horarios: filasValidas, filasImportadas: filasValidas.length };
  } catch (error: unknown) {
    if (error instanceof ExcelInvalidoError) throw error;
    
    // Si el error es un objeto Error nativo, usamos su mensaje
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    throw new ExcelInvalidoError(`Error leyendo archivo: ${mensaje}`);
  }
}