import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

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

    console.log("📡 Ejecutando merge-drive.js internamente...");
    await runMerge();

    // 📖 LEER EL JSON DESDE BLOB (NO desde disco)
    console.log("📖 Leyendo JSON desde Blob...");
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
    console.log(`✅ JSON leído. ${tree.length} nodos`);

    // ☁️ SUBIR A VERCEL BLOB (el que ve el sitio)
    console.log("☁️ Subiendo a Vercel Blob...");
    const { url } = await put("drive-tree.json", JSON.stringify(tree), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
      token: token,
      allowOverwrite: true,
    });

    console.log(`✅ JSON actualizado en: ${url}`);

    return NextResponse.json({ 
      success: true,
      message: "Actualización completada",
      nodos: tree.length,
      url: url
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