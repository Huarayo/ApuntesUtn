import { NextResponse } from "next/server";

// 🔥 IMPORTAR LAS FUNCIONES
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

    // 📡 EJECUTAR SCRIPTS
    console.log("📡 Ejecutando index.js internamente...");
    await runIndex();
    console.log("✅ drive-tree.json actualizado (solo Drive, temporal)");

    console.log("📡 Ejecutando merge-drive.js internamente...");
    await runMerge();
    console.log("✅ drive-tree-v3.json actualizado (COMPLETO, el que CRECE)");

    // 📖 LEER EL JSON COMPLETO DESDE BLOB
    console.log("📖 Leyendo JSON COMPLETO desde Blob...");
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Falta BLOB_READ_WRITE_TOKEN" }, { status: 500 });
    }

    const BLOB_URL = "https://dhfonqeb4oz4dngj.public.blob.vercel-storage.com";
    const treeRes = await fetch(`${BLOB_URL}/drive-tree-v3.json?t=${Date.now()}`);
    
    if (!treeRes.ok) {
      return NextResponse.json({ 
        error: "No se pudo leer drive-tree-v3.json desde Blob" 
      }, { status: 500 });
    }
    
    const tree = await treeRes.json();
    console.log(`✅ Árbol COMPLETO leído. ${tree.length} nodos`);

    // ✅ DEVOLVER EL ÁRBOL COMPLETO (SIN COPIAR A drive-tree.json)
    return NextResponse.json({ 
      success: true,
      message: "Actualización completada",
      nodos: tree.length,
      url: `${BLOB_URL}/drive-tree-v3.json`
    });

  } catch (error: unknown) {
    console.error("❌ Error general:", error);
    if (error instanceof Error) {
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