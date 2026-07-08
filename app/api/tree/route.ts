import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 🔥 URL de Vercel Blob (la que usás en TreeLoader.tsx)
const BLOB_URL = "https://dhfonqeb4oz4dngj.public.blob.vercel-storage.com";
const TREE_PATH = "drive-tree.json";

export async function GET() {
  try {
    // 📌 1. PRIMERO: Intentar leer desde Vercel Blob (producción)
    try {
      const url = `${BLOB_URL}/${TREE_PATH}?t=${Date.now()}`;
      const res = await fetch(url);
      
      if (res.ok) {
        const tree = await res.json();
        console.log("✅ Árbol leído desde Vercel Blob");
        return NextResponse.json(tree);
      }
    } catch (blobError) {
      console.warn("⚠️ No se pudo leer desde Vercel Blob:", blobError);
    }

    // 📌 2. SEGUNDO: Intentar leer desde el sistema de archivos (local)
    try {
      const jsonPath = path.join(process.cwd(), "public", "data", "drive-tree-v3.json");
      
      if (!fs.existsSync(jsonPath)) {
        const altPath = path.join(process.cwd(), "scripts", "data", "drive-tree-v3.json");
        if (fs.existsSync(altPath)) {
          const raw = fs.readFileSync(altPath, "utf-8");
          const tree = JSON.parse(raw);
          console.log("✅ Árbol leído desde scripts/data/");
          return NextResponse.json(tree);
        }
      } else {
        const raw = fs.readFileSync(jsonPath, "utf-8");
        const tree = JSON.parse(raw);
        console.log("✅ Árbol leído desde public/data/");
        return NextResponse.json(tree);
      }
    } catch (localError) {
      console.warn("⚠️ No se pudo leer desde el sistema de archivos:", localError);
    }

    // 📌 3. ÚLTIMO: Si nada funciona, devolver array vacío
    console.warn("⚠️ No se encontró el árbol en ningún lugar");
    return NextResponse.json([]);

  } catch (error: unknown) {
    console.error("❌ Error al leer el árbol:", error);
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