// 🔥 FUNCIÓN EXPORTABLE PARA EL WEBHOOK
export async function runMerge() {
  console.log("🔄 Ejecutando merge-drive.js...");
  
  // 1. Leer el JSON de Drive
  const drivePath = path.join(__dirname, "data", "drive-tree.json");
  const driveTree = JSON.parse(fs.readFileSync(drivePath, "utf-8"));

  // 2. Leer tu JSON actual
  const treePath = path.join(process.cwd(), "public", "data", "drive-tree-v3.json");
  let currentTree = [];
  if (fs.existsSync(treePath)) {
    currentTree = JSON.parse(fs.readFileSync(treePath, "utf-8"));
  }

  // 3. Extraer TODOS los IDs de Drive
  const driveIds = new Set();
  function collectDriveIds(nodes) {
    for (const node of nodes) {
      if (node.id) driveIds.add(node.id);
      if (node.children) collectDriveIds(node.children);
    }
  }
  collectDriveIds(driveTree);

  // 4. Actualizar carpetas por ID
  currentTree = updateFolderNames(currentTree, driveTree);

  // 5. Actualizar nombres de archivos por ID
  currentTree = updateFileNames(currentTree, driveTree);

  // 6. Eliminar archivos de Drive que ya no existen
  const deletedCount = { value: 0 };
  function removeDeletedNodes(nodes) {
    const result = [];
    for (const node of nodes) {
      if (node.type !== "folder" && node.source !== "drive") {
        result.push(node);
        continue;
      }
      if (node.type !== "folder" && node.id && !driveIds.has(node.id)) {
        console.log(`🗑️ Eliminado: ${node.name} (ya no está en Drive)`);
        deletedCount.value++;
        continue;
      }
      if (node.type === "folder") {
        if (node.children) {
          const filteredChildren = removeDeletedNodes(node.children);
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
  const treeWithoutDeleted = removeDeletedNodes(currentTree);

  // 7. Extraer IDs existentes
  const existingIds = new Set();
  function collectExistingIds(nodes) {
    for (const node of nodes) {
      if (node.id) existingIds.add(node.id);
      if (node.children) collectExistingIds(node.children);
    }
  }
  collectExistingIds(treeWithoutDeleted);

  // 8. Encontrar archivos nuevos
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

  const allDriveFiles = findAllFilesWithPath(driveTree);
  const newFiles = allDriveFiles.filter(file => !existingIds.has(file.id));

  // 9. Agregar archivos nuevos
  let addedCount = 0;
  let skippedCount = 0;

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

  // 10. Guardar el árbol actualizado
  const treePathFinal = path.join(process.cwd(), "public", "data", "drive-tree-v3.json");
  fs.writeFileSync(treePathFinal, JSON.stringify(treeWithoutDeleted, null, 2), "utf-8");

  // 11. Resumen
  console.log("");
  console.log("=".repeat(50));
  console.log("📋 RESUMEN DE SINCRONIZACIÓN");
  console.log("=".repeat(50));
  console.log(`🗑️ Archivos eliminados: ${deletedCount.value}`);
  console.log(`✅ Archivos agregados: ${addedCount}`);
  console.log(`⏭️ Archivos omitidos: ${skippedCount}`);
  console.log("=".repeat(50));

  return treeWithoutDeleted;
}
