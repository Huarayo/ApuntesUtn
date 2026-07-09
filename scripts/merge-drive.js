// 🔥 FUNCIÓN EXPORTABLE PARA EL WEBHOOK
export async function runMerge() {
  console.log("🔄 ===== INICIANDO MERGE =====");
  
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("❌ Falta BLOB_READ_WRITE_TOKEN");
  }

  const { put } = await import('@vercel/blob');
  const BLOB_URL = "https://dhfonqeb4oz4dngj.public.blob.vercel-storage.com";

  // 📥 1. Leer drive-tree.json (BASURA - solo Drive)
  console.log("📥 Leyendo drive-tree.json (solo Drive)...");
  const driveRes = await fetch(`${BLOB_URL}/drive-tree.json?t=${Date.now()}`);
  if (!driveRes.ok) {
    throw new Error("❌ No se pudo leer drive-tree.json desde Blob");
  }
  const driveTree = await driveRes.json();
  console.log(`✅ drive-tree.json leído: ${driveTree.length} nodos`);

  // 📥 2. Leer drive-tree-v3.json (el IMPORTANTE que CRECE)
  console.log("📥 Leyendo drive-tree-v3.json (el IMPORTANTE)...");
  let currentTree = [];
  try {
    const treeRes = await fetch(`${BLOB_URL}/drive-tree-v3.json?t=${Date.now()}`);
    if (treeRes.ok) {
      currentTree = await treeRes.json();
      console.log(`✅ drive-tree-v3.json leído: ${currentTree.length} nodos`);
    } else {
      console.log("ℹ️ No se encontró drive-tree-v3.json, empezando desde cero");
    }
  } catch (error) {
    console.log("ℹ️ Error leyendo drive-tree-v3.json, empezando desde cero");
  }

  // 🔥 3. EXTRAER IDs DE DRIVE
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

  // 🔥 4. ACTUALIZAR NOMBRES DE CARPETAS
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

  // 🔥 5. ACTUALIZAR NOMBRES DE ARCHIVOS
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

  // 🔥 6. ELIMINAR ARCHIVOS DE DRIVE QUE YA NO EXISTEN
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

  // 🔥 7. APLICAR TRANSFORMACIONES
  console.log("🔄 Aplicando transformaciones...");
  currentTree = updateFolderNames(currentTree);
  currentTree = updateFileNames(currentTree);
  
  const deletedCount = { value: 0 };
  const treeWithoutDeleted = removeDeletedNodes(currentTree, deletedCount);

  // 🔥 8. SINCRONIZAR ESTRUCTURA DE CARPETAS (CREAR CARPETAS NUEVAS)
  console.log("📁 Sincronizando estructura de carpetas...");

  function ensureFolderStructure(currentNodes, driveNodes) {
    for (const dNode of driveNodes) {
      if (dNode.type !== "folder") continue;

      // Buscar si la carpeta ya existe en v3 (por ID)
      let match = currentNodes.find(
        n => n.type === "folder" && n.id === dNode.id
      );

      // Fallback: si el ID cambió, buscar por nombre normalizado
      if (!match) {
        match = currentNodes.find(
          n => n.type === "folder" && n.name === dNode.name
        );
      }

      // Si no existe, CREARLA
      if (!match) {
        console.log(`📁➕ Carpeta nueva creada en v3: ${dNode.name}`);
        match = {
          name: dNode.name,
          type: "folder",
          id: dNode.id,
          source: "drive",
          url: dNode.url || `https://drive.google.com/drive/folders/${dNode.id}`,
          children: [],
        };
        currentNodes.push(match);
      }

      if (!match.children) match.children = [];

      // Recursión: sincronizar subcarpetas
      if (dNode.children && dNode.children.length > 0) {
        ensureFolderStructure(match.children, dNode.children);
      }
    }
  }

  ensureFolderStructure(treeWithoutDeleted, driveTree);


// 🔥 8.5. PROCESAR ARCHIVOS CON DRIVEPATH (los que están sueltos en driveTree)
console.log("📁 Procesando archivos con drivePath...");

function injectFlatNodesByDrivePath(currentTree, driveTree) {
  // 1. Extraer TODOS los nodos con drivePath
  function extractDrivePathNodes(nodes, currentPath = []) {
    let results = [];
    for (const node of nodes) {
      if (node.type === "folder") {
        if (node.children) {
          const childResults = extractDrivePathNodes(node.children, [...currentPath, node.name]);
          results = results.concat(childResults);
        }
      } else {
        // Es un archivo → guardar con su ruta
        results.push({
          ...node,
          drivePath: currentPath,
          folderName: currentPath.length > 0 ? currentPath[currentPath.length - 1] : "Raíz"
        });
      }
    }
    return results;
  }

  // 2. Extraer TODOS los archivos con su ruta desde driveTree
  const allDriveFiles = extractDrivePathNodes(driveTree);
  
  // 3. IDs que ya existen en currentTree
  const existingIds = new Set();
  function collectExistingIds(nodes) {
    for (const node of nodes) {
      if (node.id) existingIds.add(node.id);
      if (node.children) collectExistingIds(node.children);
    }
  }
  collectExistingIds(currentTree);

  // 4. Filtrar archivos que NO existen en currentTree
  const newFiles = allDriveFiles.filter(file => !existingIds.has(file.id));

  let addedCount = 0;
  let skippedCount = 0;

  // 5. Para cada archivo nuevo, crear carpetas y agregarlo
  for (const file of newFiles) {
    // Función que crea carpetas si no existen
    function findOrCreateFolderByPath(nodes, pathParts) {
      let current = nodes;
      for (const part of pathParts) {
        let found = current.find(node => 
          node.type === "folder" && node.name === part
        );
        if (!found) {
          console.log(`📁➕ Creando carpeta por drivePath: ${part}`);
          found = {
            name: part,
            type: "folder",
            source: "drive",
            children: []
          };
          current.push(found);
        }
        current = found.children || [];
      }
      return current;
    }

    const targetFolder = findOrCreateFolderByPath(currentTree, file.drivePath);
    if (targetFolder) {
      targetFolder.push(file);
      addedCount++;
      console.log(`✅ ${file.name} → ${file.drivePath.join("/") || "Raíz"}`);
    } else {
      skippedCount++;
      console.log(`⏭️ ${file.name} → (ruta no existe, omitido)`);
    }
  }

  console.log(`✅ Agregados por drivePath: ${addedCount}`);
  console.log(`⏭️ Omitidos por drivePath: ${skippedCount}`);
  
  return currentTree;
}

// 🔥 EJECUTAR: inyectar archivos con drivePath
treeWithoutDeleted = injectFlatNodesByDrivePath(treeWithoutDeleted, driveTree);


  // 🔥 9. AGREGAR ARCHIVOS NUEVOS DE DRIVE
  console.log("➕ Agregando archivos nuevos de Drive...");
  
  function findFolderByPath(nodes, pathParts) {
    let current = nodes;
    for (const part of pathParts) {
      const found = current.find(node => 
        node.type === "folder" && node.name === part
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

  // 📤 10. GUARDAR EN VERCEL BLOB (EL IMPORTANTE QUE CRECE)
  console.log("💾 Guardando árbol COMPLETO en Vercel Blob...");
  const { url } = await put('drive-tree-v3.json', JSON.stringify(treeWithoutDeleted), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    token: token,
    allowOverwrite: true,
  });

  // 📊 11. ESTADÍSTICAS FINALES
  console.log("");
  console.log("=".repeat(50));
  console.log("📋 RESUMEN DE SINCRONIZACIÓN");
  console.log("=".repeat(50));
  console.log(`✅ drive-tree-v3.json guardado en: ${url}`);
  console.log(`📊 Nodos finales: ${treeWithoutDeleted.length}`);
  console.log(`🗑️ Eliminados: ${deletedCount.value}`);
  console.log(`✅ Agregados: ${addedCount}`);
  console.log(`⏭️ Omitidos: ${skippedCount}`);
  console.log("=".repeat(50));
  
  return treeWithoutDeleted;
}

// ✅ Para ejecutar localmente: node scripts/merge-drive.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMerge().catch(console.error);
}