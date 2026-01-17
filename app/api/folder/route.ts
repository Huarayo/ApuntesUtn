import { NextResponse } from "next/server";
import treeRaw from "@/scripts/data/drive-tree-v2.json";
//LOADING PARA LA NAVEGACIÓN POR CARPETAS
type Node = {
  id?: string;
  name: string;
  type: string;         // "folder" o mimeType
  url?: string;
  children?: Node[];
};

const tree = treeRaw as Node[];

// Index rápido: folderId -> children
const folderIndex = new Map<string, Node[]>();

function indexTree(nodes: Node[]) {
  for (const n of nodes) {
    if (n.type === "folder" && n.id) {
      folderIndex.set(n.id, n.children ?? []);
      if (n.children) indexTree(n.children);
    }
  }
}

indexTree(tree);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  // Root
  if (!id || id === "root") {
    return NextResponse.json(tree.map(stripChildren));
  }

  const children = folderIndex.get(id) ?? [];
  return NextResponse.json(children.map(stripChildren));
}

// Para lazy loading: no mandamos "children" en la respuesta
function stripChildren(n: Node) {
  const { children, ...rest } = n;
  return rest;
}

// Construye un índice en memoria (rápido)

// /api/folder?id=root devuelve la raíz

// /api/folder?id=<FOLDER_ID> devuelve solo los hijos

// No manda children para que el cliente no cargue el árbol entero