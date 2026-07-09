// 🔥 AGREGAR AL FINAL del archivo
export async function runIndex() {
  console.log("🚀 Iniciando escaneo de Google Drive...");
  
  const visited = new Set();
  const tree = await readFolderTree(ROOT_FOLDER_ID, visited, 0);

  // 🔥 Guardar en Vercel Blob (NO en disco)
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

// ✅ Para ejecutar localmente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runIndex().catch(console.error);
}
