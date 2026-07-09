import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT_FOLDER_ID = "1b_AndWq4VbixhasOObo7wOZrIKIy08ru";
const MAX_DEPTH = 50;

// 🔥 FUNCIÓN DE AUTENTICACIÓN
async function getAuth() {
  console.log("🔍 ===== INICIANDO AUTENTICACIÓN =====");
  
  const keyJson = process.env.GOOGLE_DRIVE_KEY;
  
  if (keyJson) {
    console.log("🔑 Usando clave desde variable de entorno GOOGLE_DRIVE_KEY");
    try {
      const credentials = JSON.parse(keyJson);
      return new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
      });
    } catch (error) {
      console.error("❌ Error parseando GOOGLE_DRIVE_KEY:", error.message);
    }
  }

  const KEY_PATH = path.resolve("keys/drive-reader.json");
  if (fs.existsSync(KEY_PATH)) {
    console.log("📁 Usando clave desde archivo local:", KEY_PATH);
    return new google.auth.GoogleAuth({
      keyFile: KEY_PATH,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
  }

  throw new Error(`
❌ No se encontró la clave de Google Drive.
📌 Para LOCAL: Asegurate que existe keys/drive-reader.json
📌 Para VERCEL: Agregá GOOGLE_DRIVE_KEY como variable de entorno
  `);
}

let auth = null;
let drive = null;

async function getDrive() {
  if (!auth) {
    auth = await getAuth();
    drive = google.drive({ version: "v3", auth });
  }
  return drive;
}

async function listChildren(folderId) {
  const drive = await getDrive();
  let pageToken = undefined;
  const all = [];

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      pageSize: 1000,
      pageToken,
      fields: "nextPageToken, files(id, name, mimeType, webViewLink, shortcutDetails)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    all.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);

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
  if (depth > MAX_DEPTH) return [];

  if (visited.has(folderId)) return [];
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

  return out;
}

// 🔥 FUNCIÓN PRINCIPAL EXPORTABLE (la que usa el webhook)
export async function runIndex() {
  console.log("🚀 Iniciando escaneo de Google Drive...");
  
  const visited = new Set();
  const tree = await readFolderTree(ROOT_FOLDER_ID, visited, 0);

  // 🔥 GUARDAR EN VERCEL BLOB
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("❌ Falta BLOB_READ_WRITE_TOKEN");
  }

  const { put } = await import('@vercel/blob');
  const { url } = await put('drive-tree.json', JSON.stringify(tree), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    token: token,
    allowOverwrite: true,
  });

  console.log(`✅ Árbol de Drive guardado en Blob: ${url}`);
  console.log(`📁 Carpetas visitadas: ${visited.size}`);
  
  return tree;
}

// ✅ Para ejecutar localmente: node scripts/index.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runIndex().catch(console.error);
}