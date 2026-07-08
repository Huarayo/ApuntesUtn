import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 🔥 FUNCIÓN PARA NORMALIZAR NOMBRES
function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 🔥 BUSCAR CARPETA POR RUTA COMPLETA (no solo por nombre)
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
  return current; // Devuelve la carpeta en la posición exacta
}

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


// 🔥 NUEVA FUNCIÓN: Actualizar carpetas por ID
function updateFolderNames(nodes, driveTree) {
  // Crear un mapa de ID → nombre en Drive
  const folderMap = new Map();
  function collectFolderNames(driveNodes) {
    for (const node of driveNodes) {
      if (node.type === "folder" && node.id) {
        folderMap.set(node.id, node.name);
      }
      if (node.children) {
        collectFolderNames(node.children);
      }
    }
  }
  collectFolderNames(driveTree);

  // Recorrer el árbol y actualizar nombres
  function updateNames(nodes) {
    for (const node of nodes) {
      if (node.type === "folder" && node.id && folderMap.has(node.id)) {
        const newName = folderMap.get(node.id);
        if (node.name !== newName) {
          console.log(`📝 Carpeta renombrada: ${node.name} → ${newName}`);
          node.name = newName;
        }
      }
      if (node.children) {
        updateNames(node.children);
      }
    }
  }
  updateNames(nodes);
  return nodes;
}

// 🔥 NUEVA FUNCIÓN: Actualizar nombres de archivos por ID
function updateFileNames(nodes, driveTree) {
  // Crear un mapa de ID → nombre en Drive (solo archivos)
  const fileMap = new Map();
  function collectFileNames(driveNodes) {
    for (const node of driveNodes) {
      if (node.type !== "folder" && node.id) {
        fileMap.set(node.id, node.name);
      }
      if (node.children) {
        collectFileNames(node.children);
      }
    }
  }
  collectFileNames(driveTree);

  // Recorrer el árbol y actualizar nombres de archivos
  function updateNames(nodes) {
    for (const node of nodes) {
      if (node.type !== "folder" && node.id && fileMap.has(node.id)) {
        const newName = fileMap.get(node.id);
        if (node.name !== newName) {
          console.log(`📝 Archivo renombrado: ${node.name} → ${newName}`);
          node.name = newName;
        }
      }
      if (node.children) {
        updateNames(node.children);
      }
    }
  }
  updateNames(nodes);
  return nodes;
}

// 🔥 Aplicar después de updateFolderNames
currentTree = updateFolderNames(currentTree, driveTree);
currentTree = updateFileNames(currentTree, driveTree);  // ← AGREGAR ESTA LÍNEA

// 4. 🛡️ RECORRER TODO EL ÁRBOL para eliminar archivos
function removeDeletedNodes(nodes, deletedCount = { value:0 }) {
  const result = [];
  for (const node of nodes) {
    // 🔥 SOLO para ARCHIVOS: si NO tiene source: "drive" → externo
    if (node.type !== "folder" && node.source !== "drive") {
    //   console.log(`🛡️ Protegido (externo): ${node.name}`);
      result.push(node);
      continue;
    }
    
    // 🔥 Para ARCHIVOS de Drive: si el ID no está en Drive → eliminar
    if (node.type !== "folder" && node.id && !driveIds.has(node.id)) {
      console.log(`🗑️ Eliminado: ${node.name} (ya no está en Drive)`);
      deletedCount.value++;
      continue;
    }
    
    // 🔥 Para CARPETAS: siempre se mantienen (son estructura)
    if (node.type === "folder") {
      if (node.children) {
        const filteredChildren = removeDeletedNodes(node.children, deletedCount);
        result.push({ ...node, children: filteredChildren });
      } else {
        result.push(node);
      }
    } else {
      // Archivo que pasó todas las verificaciones
      result.push(node);
    }
  }
  return result;
}

const deletedCount = { value: 0 };
const treeWithoutDeleted = removeDeletedNodes(currentTree, deletedCount);

// 5. Extraer IDs existentes en tu JSON
const existingIds = new Set();
function collectExistingIds(nodes) {
  for (const node of nodes) {
    if (node.id) existingIds.add(node.id);
    if (node.children) collectExistingIds(node.children);
  }
}
collectExistingIds(treeWithoutDeleted);

// 6. Encontrar TODOS los archivos de Drive con su ruta
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

// 7. 📥 AGREGAR archivos nuevos a SUS CARPETAS (por RUTA COMPLETA)
let addedCount = 0;
let skippedCount = 0;

for (const file of newFiles) {
  // 🔥 Buscar la carpeta por RUTA COMPLETA (no solo por nombre)
  const targetFolder = findFolderByPath(treeWithoutDeleted, file.drivePath);
  
  if (targetFolder) {
    // ✅ La carpeta existe en la ruta exacta → agregar el archivo ahí
    targetFolder.push(file);
    addedCount++;
    const pathStr = file.drivePath.join("/") || "Raíz";
    console.log(`✅ ${file.name} → ${pathStr}`);
  } else {
    // ❌ La carpeta NO existe en esa ruta → omitir (respetar el panel)
    skippedCount++;
    const pathStr = file.drivePath.join("/") || "Raíz";
    console.log(`⏭️ ${file.name} → ${pathStr} (ruta no existe, omitido)`);
  }
}

// 8. 💾 Guardar el árbol actualizado
fs.writeFileSync(treePath, JSON.stringify(treeWithoutDeleted, null, 2), "utf-8");

// 9. 📋 Resumen
console.log("");
console.log("=".repeat(50));
console.log("📋 RESUMEN DE SINCRONIZACIÓN");
console.log("=".repeat(50));
console.log(`🗑️ Archivos eliminados: ${deletedCount.value}`);
console.log(`✅ Archivos agregados a rutas existentes: ${addedCount}`);
console.log(`⏭️ Archivos omitidos (ruta no existe): ${skippedCount}`);
console.log(`📊 Total final: ${treeWithoutDeleted.length}`);
console.log("=".repeat(50));