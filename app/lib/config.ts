// @/app/lib/config.ts

// 1. EL ÚNICO LUGAR A MODIFICAR: El import con texto fijo
import treeRaw from "@/scripts/data/drive-tree-v3.json"; 

// 2. DEFINICIÓN DE INTERFAZ
export interface Node {
  id: string;
  name: string;
  type: string;
  url?: string;
  children?: Node[];
}

// 3. VARIABLES DINÁMICAS (Se actualizan solas al cambiar arriba)
export const TREE_VERSION = "v3"; // <--- Cambiás esto a "v3" cuando corresponda
export const TREE_FILENAME = `drive-tree-${TREE_VERSION}.json`;
export const TREE_PUBLIC_PATH = `/data/${TREE_FILENAME}`;

// 4. EXPORTACIÓN DE DATOS
export const treeData = treeRaw as Node[];