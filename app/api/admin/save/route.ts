import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
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

    // 🔥 Obtener el token de Vercel Blob
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Falta BLOB_READ_WRITE_TOKEN en las variables de entorno" },
        { status: 500 }
      );
    }

    // 📌 1. Guardar en Vercel Blob (esto funciona en producción)
    const { url } = await put("drive-tree.json", JSON.stringify(tree), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      token: token,
      allowOverwrite: true, // 🔥 Permite sobrescribir
    });

    // 📌 2. También guardar localmente (para desarrollo)
    try {
      const jsonPath = path.join(process.cwd(), "scripts", "data", "drive-tree-v3.json");
      fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
      fs.writeFileSync(jsonPath, JSON.stringify(tree, null, 2), "utf-8");
    } catch (localError) {
      console.warn("⚠️ No se pudo guardar localmente (esto es normal en Vercel)");
    }

    return NextResponse.json({ 
      success: true, 
      url,
      message: "✅ Guardado en Vercel Blob" 
    });

  } catch (error: unknown) {
    console.error("❌ Error al guardar:", error);
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