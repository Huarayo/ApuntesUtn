//Crear api que fusiona los archivos

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface Node {
  id?: string;
  name: string;
  type: string;
  url?: string;
  children?: Node[];
}

export async function POST() {
  try {
    // 1. Leer el JSON de Drive
    const drivePath = path.join(process.cwd(), "scripts", "data", "drive-tree.json");
    
    if (!fs.existsSync(drivePath)) {
      return NextResponse.json(
        { error: "Primero ejecutá 'Importar desde Drive'" },
        { status: 404 }
      );
    }
    
    const raw = fs.readFileSync(drivePath, "utf-8");
    const driveTree = JSON.parse(raw);
    
    // 2. Leer tu JSON actual
    const treePath = path.join(process.cwd(), "public", "data", "drive-tree-v3.json");
    
    if (!fs.existsSync(treePath)) {
      return NextResponse.json(
        { error: "No se encuentra tu JSON actual" },
        { status: 404 }
      );
    }
    
    const currentRaw = fs.readFileSync(treePath, "utf-8");
    const currentTree = JSON.parse(currentRaw);
    
    // 3. Extraer todos los IDs existentes (para evitar duplicados)
    const existingIds = new Set<string>();
    
    function collectIds(nodes: Node[]) {
      for (const node of nodes) {
        if (node.id) existingIds.add(node.id);
        if (node.children) collectIds(node.children);
      }
    }
    collectIds(currentTree);
    
    // 4. Encontrar archivos nuevos (que no estén en tu JSON)
    function findNewNodes(nodes: Node[]): Node[] {
      const result: Node[] = [];
      for (const node of nodes) {
        // Si es un archivo y no existe en tu JSON
        if (!node.id || !existingIds.has(node.id)) {
          result.push(node);
        }
        // Si es carpeta, buscar adentro
        if (node.children) {
          const childNew = findNewNodes(node.children);
          result.push(...childNew);
        }
      }
      return result;
    }
    
    const newFiles = findNewNodes(driveTree);
    
    if (newFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay archivos nuevos para importar",
        imported: 0
      });
    }
    
    // 5. Agregar los archivos nuevos a tu árbol
    const updatedTree = [
      ...currentTree,
      {
        id: `drive-import-${Date.now()}`,
        name: `📁 Nuevos de Drive (${newFiles.length})`,
        type: "folder",
        children: newFiles
      }
    ];
    
    // 6. Guardar el árbol actualizado
    fs.writeFileSync(treePath, JSON.stringify(updatedTree, null, 2), "utf-8");
    
    return NextResponse.json({
      success: true,
      message: `✅ Importados ${newFiles.length} archivos desde Drive`,
      imported: newFiles.length,
      total: updatedTree.length
    });
    
  } catch (error: unknown) {
    console.error("❌ Error importando:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Error desconocido" },
      { status: 500 }
    );
  }
}