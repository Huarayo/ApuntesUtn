import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function POST() {
  try {
    // 1. Ejecutar el script de Drive
    console.log("🚀 Ejecutando script de Drive...");
    
    const scriptPath = path.join(process.cwd(), "scripts", "index.js");
    
    // Verificar que el script existe
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { error: "No se encuentra scripts/index.js" },
        { status: 404 }
      );
    }
    
    const { stdout, stderr } = await execPromise(`node ${scriptPath}`);
    
    if (stderr) {
      console.error("❌ Error en script:", stderr);
      return NextResponse.json(
        { error: "Error al ejecutar el script", details: stderr },
        { status: 500 }
      );
    }
    
    console.log("✅ Script ejecutado:", stdout);
    
    // 2. Leer el JSON generado por el script
    const jsonPath = path.join(process.cwd(), "scripts", "data", "drive-tree.json");
    
    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json(
        { error: "El script no generó el JSON esperado" },
        { status: 404 }
      );
    }
    
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const driveTree = JSON.parse(raw);
    
    return NextResponse.json({
      success: true,
      message: "Script ejecutado correctamente",
      files: driveTree,
      count: driveTree.length
    });
    
  } catch (error: unknown) {
    console.error("❌ Error:", error);
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