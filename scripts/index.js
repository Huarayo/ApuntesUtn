import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT_FOLDER_ID = "1b_AndWq4VbixhasOObo7wOZrIKIy08ru";
const MAX_DEPTH = 50;

// 🔥 Función para obtener autenticación (con logs detallados)
async function getAuth() {
  console.log("🔍 ===== INICIANDO AUTENTICACIÓN =====");
  console.log("🔍 1. Buscando GOOGLE_DRIVE_KEY en variables de entorno...");
  console.log("🔑 ¿GOOGLE_DRIVE_KEY existe?", !!process.env.GOOGLE_DRIVE_KEY);
  
  // 1️⃣ INTENTAR DESDE VARIABLE DE ENTORNO (Vercel)
  const keyJson = process.env.GOOGLE_DRIVE_KEY;
  
  if (keyJson) {
    console.log("✅ GOOGLE_DRIVE_KEY encontrada (longitud:", keyJson.length, "caracteres)");
    console.log("🔍 Primeros 100 caracteres:", keyJson.substring(0, 100) + "...");
    
    try {
      console.log("🔍 Parseando JSON...");
      const credentials = JSON.parse(keyJson);
      console.log("✅ JSON parseado correctamente");
      console.log("📧 Client email:", credentials.client_email);
      console.log("📋 Project ID:", credentials.project_id);
      
      console.log("🔍 Creando GoogleAuth...");
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });
      console.log("✅ GoogleAuth creado correctamente");
      return auth;
    } catch (error) {
      console.error("❌ Error parseando GOOGLE_DRIVE_KEY:", error.message);
      console.error("❌ Error stack:", error.stack);
      // Si falla, intentar con archivo
    }
  } else {
    console.log("❌ GOOGLE_DRIVE_KEY NO encontrada en variables de entorno");
  }

  // 2️⃣ INTENTAR DESDE ARCHIVO LOCAL (desarrollo)
  console.log("🔍 2. Buscando archivo local keys/drive-reader.json...");
  const KEY_PATH = path.resolve("keys/drive-reader.json");
  console.log("📁 Ruta:", KEY_PATH);
  console.log("📁 ¿Existe el archivo?", fs.existsSync(KEY_PATH));
  
  if (fs.existsSync(KEY_PATH)) {
    console.log("✅ Archivo encontrado. Usando clave desde archivo local");
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: KEY_PATH,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });
      console.log("✅ GoogleAuth creado desde archivo local");
      return auth;
    } catch (error) {
      console.error("❌ Error creando auth desde archivo local:", error.message);
    }
  }

  // 3️⃣ SI NADA FUNCIONA, ERROR CLARO
  console.error("❌ TODAS LAS OPCIONES FALLARON");
  console.error("❌ No se encontró la clave de Google Drive.");
  console.error("📌 Para LOCAL: Asegurate que existe keys/drive-reader.json");
  console.error("📌 Para VERCEL: Agregá GOOGLE_DRIVE_KEY como variable de entorno");
  console.error("📌 La variable debe contener el contenido COMPLETO del archivo drive-reader.json");
  
  throw new Error("❌ No se pudo autenticar con Google Drive");
}

// El resto del código se mantiene igual, pero con más logs
let auth = null;
let drive = null;

async function getDrive() {
  console.log("🔍 getDrive() llamado");
  if (!auth) {
    console.log("🔍 Auth no inicializado. Llamando a getAuth()...");
    auth = await getAuth();
    console.log("🔍 Creando drive...");
    drive = google.drive({ version: "v3", auth });
    console.log("✅ Drive creado correctamente");
  } else {
    console.log("✅ Auth ya inicializado, reusando...");
  }
  return drive;
}

async function listChildren(folderId) {
  console.log(`🔍 listChildren("${folderId}") llamado`);
  const drive = await getDrive();
  let pageToken = undefined;
  const all = [];

  do {
    console.log(`🔍 Consultando Drive con pageToken: ${pageToken || "inicial"}`);
    try {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        pageSize: 1000,
        pageToken,
        fields: "nextPageToken, files(id, name, mimeType, webViewLink, shortcutDetails)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const count = (res.data.files || []).length;
      console.log(`✅ Encontrados ${count} archivos en carpeta ${folderId}`);
      all.push(...(res.data.files || []));
      pageToken = res.data.nextPageToken || undefined;
    } catch (error) {
      console.error(`❌ Error listando carpeta ${folderId}:`, error.message);
      console.error("❌ Error stack:", error.stack);
      throw error;
    }
  } while (pageToken);

  console.log(`✅ total ${all.length} archivos en carpeta ${folderId}`);
  return all;
}

function isFolder(f) {
  return f.mimeType === "application/vnd.google-apps.folder";
}

function toFileNode(f) {
  const url =
    f.webViewLink ||
    (isFolder(f)
      ? `https://drive.google.com/drive/folders/${f.id}`
      : `https://drive.google.com/file/d/${f.id}/preview`);

  return {
    name: f.name,
    type: f.mimeType,
    id: f.id,
    url,
    source: "drive"
  };
}

async function readFolderTree(folderId, visited, depth) {
  console.log(`🔍 readFolderTree("${folderId}", depth: ${depth})`);
  
  if (depth > MAX_DEPTH) {
    console.log(`⚠️ Profundidad máxima alcanzada (${MAX_DEPTH})`);
    return [];
  }

  if (visited.has(folderId)) {
    console.log(`⚠️ Carpeta ${folderId} ya visitada`);
    return [];
  }
  visited.add(folderId);

  const children = await listChildren(folderId);

  children.sort((a, b) => {
    const af = isFolder(a) ? 0 : 1;
    const bf = isFolder(b) ? 0 : 1;
    if (af !== bf) return af - bf;
    return (a.name || "").localeCompare(b.name || "", "es");
  });

  const out = [];

  for (const f of children) {
    if (f.mimeType === "application/vnd.google-apps.shortcut") continue;

    if (isFolder(f)) {
      out.push({
        name: f.name,
        type: "folder",
        id: f.id,
        source: "drive",
        url: `https://drive.google.com/drive/folders/${f.id}`,
        children: await readFolderTree(f.id, visited, depth + 1),
      });
    } else {
      out.push(toFileNode(f));
    }
  }

  console.log(`✅ Carpeta ${folderId}: ${out.length} elementos`);
  return out;
}

async function main() {
  console.log("🚀 ===== INICIANDO ESCANEO DE GOOGLE DRIVE =====");
  console.log("📁 ROOT_FOLDER_ID:", ROOT_FOLDER_ID);
  console.log("📁 MAX_DEPTH:", MAX_DEPTH);
  console.log("🔍 process.cwd():", process.cwd());
  console.log("🔍 __dirname:", __dirname);
  
  const visited = new Set();
  console.log("🔍 Leyendo árbol de carpetas...");
  const tree = await readFolderTree(ROOT_FOLDER_ID, visited, 0);

  console.log(`📊 Árbol completado. Total carpetas visitadas: ${visited.size}`);
  console.log(`📊 Total nodos raíz: ${tree.length}`);

  // Guardar en scripts/data/
  const outputPath = path.join(process.cwd(), "scripts", "data", "drive-tree.json");
  console.log(`📁 Guardando en: ${outputPath}`);
  
  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(tree, null, 2), "utf-8");
    console.log(`✅ Archivo guardado correctamente (${JSON.stringify(tree, null, 2).length} bytes)`);
  } catch (error) {
    console.error("❌ Error guardando archivo:", error.message);
    throw error;
  }

  console.log("✅ ===== ESCANEO COMPLETADO CON ÉXITO =====");
}

main().catch((e) => {
  console.error("❌ ===== ERROR FATAL =====");
  console.error("❌ Error:", e?.message || e);
  console.error("❌ Stack:", e?.stack || "No stack disponible");
  process.exit(1);
});