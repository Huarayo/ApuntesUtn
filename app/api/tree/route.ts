import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // 📌 CAMBIÁ ESTA LÍNEA: Usá tu JSON existente
    const jsonPath = path.join(process.cwd(), "public", "data", "drive-tree-v3.json");
    
    // Si no existe, intentá con scripts/data/
    if (!fs.existsSync(jsonPath)) {
      const altPath = path.join(process.cwd(), "scripts", "data", "drive-tree-v3.json");
      if (fs.existsSync(altPath)) {
        const raw = fs.readFileSync(altPath, "utf-8");
        const tree = JSON.parse(raw);
        return NextResponse.json(tree);
      }
      // Si no existe ninguno, devolver array vacío
      return NextResponse.json([]);
    }
    
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const tree = JSON.parse(raw);
    return NextResponse.json(tree);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Error desconocido al leer el árbol" },
      { status: 500 }
    );
  }
}