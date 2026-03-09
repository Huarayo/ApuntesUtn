import { google } from 'googleapis';

import path from 'path';

import fs from 'fs';

// 1. CONFIGURACIÓN DE RUTAS
const __dirname = path.resolve();
const KEY_PATH = path.join(__dirname, 'keys', 'drive-read.json');
const OUTPUT_PATH = path.join(__dirname, 'scripts', 'data', 'drive-tree.json');

// 2. ID DE LA CARPETA PÚBLICA (Viewer)
const ROOT_FOLDER_ID = "1XTM9vrEeNiXk8YAeh50TPVDzSSigBEjT"; 

async function generateDriveTree() {
  // Verificar si existen las credenciales
  if (!fs.existsSync(KEY_PATH)) {
    console.error(`❌ Error: No existe el archivo en ${KEY_PATH}`);
    return;
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({ version: 'v3', auth });

  console.log("🚀 Iniciando escaneo de carpeta pública...");

  async function listFolderContent(folderId) {
    const nodes = [];
    let pageToken = undefined;

    try {
      do {
        const res = await drive.files.list({
          // Buscamos archivos cuyo padre sea el ID actual
          q: `'${folderId}' in parents and trashed = false`,
          fields: 'nextPageToken, files(id, name, mimeType, webViewLink)',
          pageSize: 1000,
          pageToken: pageToken,
          // Importante para carpetas compartidas/públicas
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        for (const file of res.data.files) {
          const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
          const node = {
            id: file.id,
            name: file.name,
            type: isFolder ? 'folder' : 'file',
            url: file.webViewLink,
          };

          if (isFolder) {
            console.log(`📁 Explorando: ${file.name}`);
            node.children = await listFolderContent(file.id); // Recursión
          }
          nodes.push(node);
        }
        pageToken = res.data.nextPageToken;
      } while (pageToken);

      return nodes;
    } catch (err) {
      console.error(`⚠️ Error leyendo carpeta ${folderId}:`, err.message);
      return [];
    }
  }

  const tree = await listFolderContent(ROOT_FOLDER_ID);
  
  // Guardar el resultado para el buscador
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(tree, null, 2));
  
  console.log(`✅ Árbol generado con éxito en: ${OUTPUT_PATH}`);
}

generateDriveTree();