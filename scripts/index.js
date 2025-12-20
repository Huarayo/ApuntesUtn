import { google } from "googleapis";
import fs from "fs";
import path from "path";

const KEY_PATH = path.resolve("../keys/drive-reader.json");
const ROOT_FOLDER_ID = "1E4TVcYymK5-73b05_39XQW6QYiVf6b6s";

// Opcional: para no reventar con árboles profundos
const MAX_DEPTH = 50;

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_PATH,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({ version: "v3", auth });

async function listChildren(folderId) {
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
  // webViewLink es el link correcto para ver (Docs/Sheets/Slides y binarios)
  const url =
    f.webViewLink ||
    (isFolder(f)
      ? `https://drive.google.com/drive/folders/${f.id}`
      : `https://drive.google.com/file/d/${f.id}/preview`);

  return {
    name: f.name,
    type: f.mimeType,
    url,
  };
}

async function readFolderTree(folderId, visited, depth) {
  if (depth > MAX_DEPTH) return [];

  if (visited.has(folderId)) return [];
  visited.add(folderId);

  const children = await listChildren(folderId);

  // Orden: primero carpetas, luego archivos (mejor UX)
  children.sort((a, b) => {
    const af = isFolder(a) ? 0 : 1;
    const bf = isFolder(b) ? 0 : 1;
    if (af !== bf) return af - bf;
    return (a.name || "").localeCompare(b.name || "", "es");
  });

  const out = [];

  for (const f of children) {
    // Si aparece un shortcut, lo ignoramos para evitar líos (podés cambiarlo si querés)
    if (f.mimeType === "application/vnd.google-apps.shortcut") continue;

    if (isFolder(f)) {
      out.push({
        name: f.name,
        type: "folder",
        id: f.id,
        url: `https://drive.google.com/drive/folders/${f.id}`,
        children: await readFolderTree(f.id, visited, depth + 1),
      });
    } else {
      out.push(toFileNode(f));
    }
  }

  return out;
}

async function main() {
  // Verificación rápida de key
  if (!fs.existsSync(KEY_PATH)) {
    throw new Error(`No existe el archivo de credenciales: ${KEY_PATH}`);
  }

  const visited = new Set();
  const tree = await readFolderTree(ROOT_FOLDER_ID, visited, 0);

  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync("data/drive-tree.json", JSON.stringify(tree, null, 2), "utf-8");

  console.log(`✔ Árbol completo generado. Carpetas visitadas: ${visited.size}`);
}

main().catch((e) => {
  console.error("❌ Error:", e?.message || e);
  process.exit(1);
});
