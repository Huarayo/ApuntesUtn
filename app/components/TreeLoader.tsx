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

async function fetchTreeOnce(): Promise<TreeNode[]> {
  if (cachedTree) return cachedTree;

  if (!cachedPromise) {
    cachedPromise = fetch("/data/drive-tree.json", { cache: "force-cache" })
      .then((r) => r.json())
      .then((data: TreeNode[]) => {
        cachedTree = data;
        return data;
      })
      .catch((err) => {
        cachedPromise = null;
        throw err;
      });
  }

  return cachedPromise;
}

export function useTree() {
  const [tree, setTree] = useState<TreeNode[] | null>(cachedTree);

  useEffect(() => {
    if (!tree) fetchTreeOnce().then(setTree);
  }, [tree]);

  return tree;
}
