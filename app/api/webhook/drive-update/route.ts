import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { put } from "@vercel/blob";

// 🔥 IMPORTAR DIRECTAMENTE (NO child_process)
import { runIndex } from "@/scripts/index";
import { runMerge } from "@/scripts/merge-drive";

export async function POST(req: Request) {
  try {
    // 🔐 Autenticación
    const authHeader = req.headers.get("authorization");
    const secret = process.env.WEBHOOK_SECRET;
    
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log("📢 Webhook recibido - Actualizando desde Drive");

    // 📡 EJECUTAR SCRIPTS COMO FUNCIONES (no exec)
    console.log("📡 Ejecutando index.js internamente...");
    await runIndex();

    console.log("📡 Ejecutando merge-drive.js internamente...");
    await runMerge();

    // 📖 Leer el JSON COMPLETO (drive-tree-v3.json)
    console.log("📖 Leyendo JSON...");
    const jsonPath = path.join(process.cwd(), "scripts", "data", "drive-tree-v3.json");
    
    if (!fs.existsSync(jsonPath)) {
      console.error("❌ No existe:", jsonPath);
      return NextResponse.json({ 
        error: "No se encontró scripts/data/drive-tree-v3.json" 
      }, { status: 500 });
    }
    
    const jsonContent = fs.readFileSync(jsonPath, "utf-8");
    const tree = JSON.parse(jsonContent);
    console.log(`✅ JSON leído. ${tree.length} nodos`);

    // ☁️ Subir a Vercel Blob
    const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    
    if (hasToken) {
      console.log("☁️ Subiendo a Vercel Blob...");
      const { url } = await put("drive-tree.json", JSON.stringify(tree), {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json",
        allowOverwrite: true,
      });
      console.log(`✅ JSON actualizado en: ${url}`);
    } else {
      console.log("ℹ️ Sin token de Blob - solo guardado local");
    }

    return NextResponse.json({ 
      success: true,
      message: "Actualización completada",
      nodos: tree.length
    });

  } catch (error: unknown) {
    console.error("❌ Error general:", error);
    if (error instanceof Error) {
      console.error("Stack:", error.stack);
      return NextResponse.json({ 
        error: error.message,
        stack: error.stack
      }, { status: 500 });
    }
    return NextResponse.json({ 
      error: "Error desconocido" 
    }, { status: 500 });
  }
}
