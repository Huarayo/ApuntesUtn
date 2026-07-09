// 🔥 AGREGAR AL FINAL del archivo
export async function runMerge() {
  console.log("🔄 Ejecutando merge-drive.js...");
  
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("❌ Falta BLOB_READ_WRITE_TOKEN");
  }

  const { put } = await import('@vercel/blob');
  const BLOB_URL = "https://dhfonqeb4oz4dngj.public.blob.vercel-storage.com";

  // 📥 Leer drive-tree.json (foto de Drive - BASURA)
  console.log("📥 Leyendo drive-tree.json (solo Drive)...");
  const driveRes = await fetch(`${BLOB_URL}/drive-tree.json?t=${Date.now()}`);
  if (!driveRes.ok) {
    throw new Error("❌ No se pudo leer drive-tree.json desde Blob");
  }
  const driveTree = await driveRes.json();
  console.log(`✅ drive-tree.json leído. ${driveTree.length} nodos`);

  // 📥 Leer drive-tree-v3.json (el IMPORTANTE que CRECE)
  console.log("📥 Leyendo drive-tree-v3.json (el IMPORTANTE)...");
  let currentTree = [];
  try {
    const treeRes = await fetch(`${BLOB_URL}/drive-tree-v3.json?t=${Date.now()}`);
    if (treeRes.ok) {
      currentTree = await treeRes.json();
      console.log(`✅ drive-tree-v3.json leído. ${currentTree.length} nodos`);
    } else {
      console.log("ℹ️ No se encontró drive-tree-v3.json, empezando desde cero");
    }
  } catch (error) {
    console.log("ℹ️ Error leyendo drive-tree-v3.json, empezando desde cero");
  }

  // 🔥 EXTRAER IDs DE DRIVE (para saber qué existe)
  console.log("🔍 Extrayendo IDs de Drive...");
  const driveIds = new Set();
  function collectDriveIds(nodes) {
    for (const node of nodes) {
      if (node.id) driveIds.add(node.id);
      if (node.children) collectDriveIds(node.children);
    }
  }
  collectDriveIds(driveTree);
  console.log(`✅ ${driveIds.size} IDs de Drive encontrados`);

  // 🔥 ACTUALIZAR NOMBRES DE CARPETAS
  console.log("📝 Actualizando nombres de carpetas...");
  function updateFolderNames(nodes) {
    const folderMap = new Map();
    function collectFolderNames(driveNodes) {
      for (const node of driveNodes) {
        if (node.type === "folder" && node.id) {
          folderMap.set(node.id, node.name);
        }
        if (node.children) collectFolderNames(node.children);
      }
    }
    collectFolderNames(driveTree);

    function updateNames(nodes) {
      for (const node of nodes) {
        if (node.type === "folder" && node.id && folderMap.has(node.id)) {
          const newName = folderMap.get(node.id);
          if (node.name !== newName) {
            console.log(`📝 Carpeta renombrada: ${node.name} → ${newName}`);
            node.name = newName;
          }
        }
        if (node.children) updateNames(node.children);
      }
    }
    updateNames(nodes);
    return nodes;
  }

  // 🔥 ACTUALIZAR NOMBRES DE ARCHIVOS
  console.log("📝 Actualizando nombres de archivos...");
  function updateFileNames(nodes) {
    const fileMap = new Map();
    function collectFileNames(driveNodes) {
      for (const node of driveNodes) {
        if (node.type !== "folder" && node.id) {
          fileMap.set(node.id, node.name);
        }
        if (node.children) collectFileNames(node.children);
      }
    }
    collectFileNames(driveTree);

    function updateNames(nodes) {
      for (const node of nodes) {
        if (node.type !== "folder" && node.id && fileMap.has(node.id)) {
          const newName = fileMap.get(node.id);
          if (node.name !== newName) {
            console.log(`📝 Archivo renombrado: ${node.name} → ${newName}`);
            node.name = newName;
          }
        }
        if (node.children) updateNames(node.children);
      }
    }
    updateNames(nodes);
    return nodes;
  }

  // 🔥 ELIMINAR ARCHIVOS DE DRIVE QUE YA NO EXISTEN
  console.log("🗑️ Eliminando archivos borrados de Drive...");
  function removeDeletedNodes(nodes, deletedCount = { value: 0 }) {
    const result = [];
    for (const node of nodes) {
      // ✅ Archivos EXTERNOS: se mantienen siempre
      if (node.type !== "folder" && node.source !== "drive") {
        result.push(node);
        continue;
      }
      // ❌ Archivos de Drive que ya no están en Drive: se eliminan
      if (node.type !== "folder" && node.id && !driveIds.has(node.id)) {
        console.log(`🗑️ Eliminado: ${node.name} (ya no está en Drive)`);
        deletedCount.value++;
        continue;
      }
      // 📁 Carpetas: se mantienen (es estructura)
      if (node.type === "folder") {
        if (node.children) {
          const filteredChildren = removeDeletedNodes(node.children, deletedCount);
          result.push({ ...node, children: filteredChildren });
        } else {
          result.push(node);
        }
      } else {
        result.push(node);
      }
    }
    return result;
  }

  // 🔥 APLICAR TODAS LAS TRANSFORMACIONES
  console.log("🔄 Aplicando transformaciones...");
  currentTree = updateFolderNames(currentTree);
  currentTree = updateFileNames(currentTree);
  
  const deletedCount = { value: 0 };
  const treeWithoutDeleted = removeDeletedNodes(currentTree, deletedCount);

  // 🔥 AGREGAR ARCHIVOS NUEVOS DE DRIVE
  console.log("➕ Agregando archivos nuevos de Drive...");
  function normalizeName(name) {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function findFolderByPath(nodes, pathParts) {
    let current = nodes;
    for (const part of pathParts) {
      const normalizedPart = normalizeName(part);
      const found = current.find(node => 
        node.type === "folder" && normalizeName(node.name) === normalizedPart
      );
      if (!found) return null;
      current = found.children || [];
    }
    return current;
  }

  function findAllFilesWithPath(nodes, currentPath = []) {
    let results = [];
    for (const node of nodes) {
      if (node.type === "folder") {
        if (node.children) {
          const childResults = findAllFilesWithPath(node.children, [...currentPath, node.name]);
          results = results.concat(childResults);
        }
      } else {
        results.push({
          ...node,
          drivePath: currentPath,
          folderName: currentPath.length > 0 ? currentPath[currentPath.length - 1] : "Raíz"
        });
      }
    }
    return results;
  }

  const existingIds = new Set();
  function collectExistingIds(nodes) {
    for (const node of nodes) {
      if (node.id) existingIds.add(node.id);
      if (node.children) collectExistingIds(node.children);
    }
  }
  collectExistingIds(treeWithoutDeleted);

  const allDriveFiles = findAllFilesWithPath(driveTree);
  const newFiles = allDriveFiles.filter(file => !existingIds.has(file.id));

  let addedCount = 0;
  let skippedCount = 0;
  for (const file of newFiles) {
    const targetFolder = findFolderByPath(treeWithoutDeleted, file.drivePath);
    if (targetFolder) {
      targetFolder.push(file);
      addedCount++;
      console.log(`✅ ${file.name} → ${file.drivePath.join("/") || "Raíz"}`);
    } else {
      skippedCount++;
      console.log(`⏭️ ${file.name} → (ruta no existe, omitido)`);
    }
  }

  // 📤 GUARDAR EN VERCEL BLOB (EL IMPORTANTE QUE CRECE)
  console.log("💾 Guardando árbol COMPLETO en Vercel Blob...");
  const { url } = await put('drive-tree-v3.json', JSON.stringify(treeWithoutDeleted), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    token: token,
    allowOverwrite: true,
  });

  // 📊 ESTADÍSTICAS FINALES
  console.log("📊 ===== ESTADÍSTICAS FINALES =====");
  console.log(`✅ drive-tree-v3.json guardado en Blob: ${url}`);
  console.log(`📊 Nodos finales: ${treeWithoutDeleted.length}`);
  console.log(`🗑️ Eliminados: ${deletedCount.value}`);
  console.log(`✅ Agregados: ${addedCount}`);
  console.log(`⏭️ Omitidos: ${skippedCount}`);
  console.log("📊 ================================");
  
  return treeWithoutDeleted;
}