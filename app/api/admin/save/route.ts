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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tree: Node[] = body.tree;
    
    // 📌 CAMBIÁ ESTA LÍNEA: Guardá en tu JSON existente
    const jsonPath = path.join(process.cwd(), "public", "data", "drive-tree-v3.json");
    
    // Asegurar que la carpeta existe
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    
    // Guardar el JSON en el disco
    fs.writeFileSync(jsonPath, JSON.stringify(tree, null, 2), "utf-8");
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Error desconocido al guardar" },
      { status: 500 }
    );
  }
}