// lib/utils.ts
import fs from "fs";
import path from "path";
import { cache } from "react";

// --- INTERFAZ (Ahora exportada) ---
export interface Node {
  id: string;
  name: string;
  type: string;
  url?: string;
  children?: Node[];
}

// --- HELPERS (Todos con export) ---
export const cleanName = (name: string) => name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const parseSeg = (seg: string) => {
  const idx = seg.indexOf("--");
  return idx === -1 ? { id: seg } : { id: seg.slice(idx + 2) };
};

export const isFolder = (n: Node) =>
  n.type === "folder" || n.type === "application/vnd.google-apps.folder";

// ✅ lee el JSON y lo cachea
export const getTree = cache((): Node[] => {
  const filePath = path.join(process.cwd(), "public", "data", "drive-tree-v2.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as Node[];
});

export const findName = (nodes: Node[], targetId: string): string | null => {
  for (const n of nodes) {
    if (n.id === targetId) return n.name;
    if (n.children) {
      const res = findName(n.children, targetId);
      if (res) return res;
    }
  }
  return null;
};