"use client";

import { useEffect, useState } from "react";

export type TreeNode = {
  id?: string;
  name: string;
  type: string;
  url?: string;
  children?: TreeNode[];
};

let cachedTree: TreeNode[] | null = null;
let cachedPromise: Promise<TreeNode[]> | null = null;

const BLOB_URL = "https://dhfonqeb4oz4dngj.public.blob.vercel-storage.com";
const TREE_PATH = "drive-tree-v3.json";

async function fetchTreeOnce(): Promise<TreeNode[]> {
  // 1️⃣ Memoria
  if (cachedTree) {
    console.log(`📦 Árbol desde memoria: ${cachedTree.length} nodos`);
    return cachedTree;
  }

  // 2️⃣ Descargar (el SW lo intercepta y cachea)
  if (!cachedPromise) {
    const url = `${BLOB_URL}/${TREE_PATH}`;
    console.log("🌐 Descargando árbol desde Blob (con SW)...");

    cachedPromise = fetch(url, { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`Error: ${r.status}`);
        return r.json();
      })
      .then((data: TreeNode[]) => {
        cachedTree = data;
        console.log(`✅ Árbol cargado: ${data.length} nodos`);
        return data;
      })
      .catch((err) => {
        cachedPromise = null;
        console.error("❌ Error:", err);
        
        // 🔥 FALLBACK: Si no hay internet, intentar con el SW
        return caches.match(url).then((response) => {
          if (response) {
            console.log("📦 Usando caché del Service Worker (OFFLINE)");
            return response.json();
          }
          throw new Error("No hay conexión y no hay caché disponible");
        });
      });
  }

  return cachedPromise;
}

export function useTree() {
  const [tree, setTree] = useState<TreeNode[] | null>(cachedTree);
  const [error, setError] = useState<Error | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Detectar cambios de conexión
  useEffect(() => {
    const updateStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  useEffect(() => {
    if (!tree) {
      fetchTreeOnce()
        .then(setTree)
        .catch((err) => {
          setError(err);
          // Si estamos offline y hay error, mostrar mensaje amigable
          if (isOffline) {
            console.warn("📶 Offline: usando caché del SW si está disponible");
          }
        });
    }
  }, [tree, isOffline]);

  if (error) {
    console.error("Error cargando árbol:", error);
    return [];
  }

  return tree || [];
}