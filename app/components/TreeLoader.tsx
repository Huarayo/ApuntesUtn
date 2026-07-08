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

// ✅ Leer de Vercel Blob
const BLOB_URL = process.env.NEXT_PUBLIC_BLOB_URL 
const TREE_PATH = "drive-tree.json"; //NOMBRE VERCEL BLOB

async function fetchTreeOnce(): Promise<TreeNode[]> {
  if (cachedTree) return cachedTree;

  if (!cachedPromise) {
    // ✅ Siempre traer la última versión
    const url = `${BLOB_URL}/${TREE_PATH}?t=${Date.now()}`;

    // 📌 Usá la API tree (que lee tu JSON)
    cachedPromise = fetch(url, {cache: "no-store"})
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar el árbol");
        return r.json();
      })
      .then((data: TreeNode[]) => {
        cachedTree = data;
        return data;
      })
      .catch((err: Error) => {
        cachedPromise = null;
        throw err;
      });
  }

  return cachedPromise;
}

export function useTree() {
  const [tree, setTree] = useState<TreeNode[] | null>(cachedTree);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tree) {
      fetchTreeOnce()
        .then(setTree)
        .catch(setError);
    }
  }, [tree]);

  if (error) {
    console.error("Error cargando árbol:", error);
    return [];
  }

  return tree;
}