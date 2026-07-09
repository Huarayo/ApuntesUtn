import { NextResponse } from "next/server";

// 🔥 IMPORTAR LAS FUNCIONES
import { runIndex } from "@/scripts/index";
import { runMerge } from "@/scripts/merge-drive";

// ✅ FORZAR RUNTIME NODE.JS (para usar fs, googleapis, etc.)
export const runtime = "nodejs";

// ✅ EVITAR CACHÉ EN VERCEL
export const dynamic = "force-dynamic";

// ✅ AUMENTAR TIMEOUT (60s para plan Hobby, 300s+ para Pro)
export const maxDuration = 300; // Ajustá según tu plan

export async function POST(req: Request) {
  try {
    // 🔐 Autenticación
    const authHeader = req.headers.get("authorization");
    const secret = process.env.WEBHOOK_SECRET;
    
    if (!secret || authHeader !== `Bearer ${secret}`) {
      console.warn("⚠️ Intento de acceso no autorizado");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log("📢 Webhook recibido - Actualizando desde Drive");
    const startTime = Date.now();

    // 📡 EJECUTAR SCRIPTS
    console.log("📡 Ejecutando index.js internamente...");
    const indexStart = Date.now();
    await runIndex();
    console.log(`✅ runIndex() completado en ${Date.now() - indexStart}ms`);
    console.log("✅ drive-tree.json actualizado (solo Drive, temporal)");

    console.log("📡 Ejecutando merge-drive.js internamente...");
    const mergeStart = Date.now();
    const tree = await runMerge(); // ✅ GUARDA EL ÁRBOL COMPLETO
    console.log(`✅ runMerge() completado en ${Date.now() - mergeStart}ms`);
    console.log(`✅ drive-tree-v3.json actualizado (COMPLETO, ${tree.length} nodos)`);

    const totalTime = Date.now() - startTime;
    console.log(`✅ Webhook completado en ${totalTime}ms`);

    // ✅ DEVOLVER EL ÁRBOL COMPLETO (SIN fetch extra)
    return NextResponse.json({ 
      success: true,
      message: "Actualización completada",
      nodos: tree.length,
      tiempo_ms: totalTime,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    // ❌ SOLO LOGS EN SERVIDOR (NUNCA EN CLIENTE)
    console.error("❌ Error general en webhook:", error);
    
    // ✅ Mensaje genérico para el cliente (sin stack trace)
    if (error instanceof Error) {
      // Log completo en el servidor para debugging
      console.error("📋 Detalles del error:", {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      // Respuesta segura para el cliente
      return NextResponse.json({ 
        error: "Error interno del servidor",
        message: error.message // Solo el mensaje, sin stack
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: "Error desconocido" 
    }, { status: 500 });
  }
}