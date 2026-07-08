import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execPromise = promisify(exec);

export async function POST(req: Request) {
  try {
    // 🔐 Verificar autenticación
    const authHeader = req.headers.get("authorization");
    const secret = process.env.WEBHOOK_SECRET;
    
    console.log("🔑 Secret:", secret);
    console.log("📨 Auth header:", authHeader);
    
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log("📢 Webhook recibido - Actualizando desde Drive");

    // 📡 Ejecutar scripts
    console.log("📡 Ejecutando index.js...");
    try {
      const { stdout, stderr } = await execPromise("node scripts/index.js");
      console.log("✅ index.js stdout:", stdout);
      if (stderr) console.warn("⚠️ index.js stderr:", stderr);
    } catch (error) {
      console.error("❌ Error en index.js:", error);
      return NextResponse.json({ 
        error: "Error en index.js", 
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }

    console.log("📡 Ejecutando merge-drive.js...");
    try {
      const { stdout, stderr } = await execPromise("node scripts/merge-drive.js");
      console.log("✅ merge-drive.js stdout:", stdout);
      if (stderr) console.warn("⚠️ merge-drive.js stderr:", stderr);
    } catch (error) {
      console.error("❌ Error en merge-drive.js:", error);
      return NextResponse.json({ 
        error: "Error en merge-drive.js", 
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }

    // 📖 Leer el JSON generado
    console.log("📖 Leyendo JSON...");
    const jsonPath = path.join(process.cwd(), "scripts", "data", "drive-tree.json");
    console.log("📁 Buscando en:", jsonPath);
    
    if (!fs.existsSync(jsonPath)) {
      console.error("❌ No existe:", jsonPath);
      return NextResponse.json({ 
        error: "No se encontró scripts/data/drive-tree.json" 
      }, { status: 500 });
    }
    
    const jsonContent = fs.readFileSync(jsonPath, "utf-8");
    const tree = JSON.parse(jsonContent);
    console.log(`✅ JSON leído. ${tree.length} nodos`);

    // ☁️ Subir a Vercel Blob (si tenés token)
    const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    console.log("🔑 ¿Token de Blob presente?", hasToken);
    
    if (hasToken) {
      const { put } = await import('@vercel/blob');
      console.log("☁️ Subiendo a Vercel Blob...");
      const { url } = await put("drive-tree.json", JSON.stringify(tree), {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json",
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