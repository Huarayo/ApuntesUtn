import { NextResponse } from "next/server";
import treeRaw from "@/scripts/data/drive-tree-v2.json";

type Node = {
  id?: string;
  name: string;
  type: string;
  url?: string;
  children?: Node[];
};
function norm(s: string){
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") //sacar tildes
    .replace(/[_-]+/g, " ")  //_ y - a espacio
    .replace(/[^a-z0-9\s]+/g, " ") //otros simbolos
    .replace(/\s+/g, " ")
    .trim();
}


function isFolder(n: Node) {
  return n.type === "folder" || n.type === "application/vnd.google-apps.folder";
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function segOfFolder(n: Node) {
  return `${slugify(n.name)}--${n.id ?? ""}`;
}

type SearchResult = {
  id?: string;
  name: string;
  type: string;
  url?: string;
  href: string;
  isFolder: boolean;
  normName: string
};

let FLAT: SearchResult[] | null = null;

function buildFlat() {
  const out: SearchResult[] = [];
  const walk = (nodes: Node[], path: string[] = []) => {
    for (const node of nodes) {
      const folder = isFolder(node);
      const seg = folder ? segOfFolder(node) : "";
      const nextPath = folder ? [...path, seg] : path;

      out.push({
        id: node.id,
        name: node.name,
        type: node.type,
        url: node.url,
        isFolder: folder,
        href: folder
          ? "/browse/" + nextPath.map(encodeURIComponent).join("/")
          : (node.url ?? "#"),
        normName: norm(node.name) // mejor que norm(item.name)
      });

      if (node.children?.length) walk(node.children, nextPath);
    }
  };

  walk(treeRaw as Node[]);
  return out;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  //lee el parametro q de la URL como esta /api/search?q=analisis&limit=20
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);

  if (!FLAT) FLAT = buildFlat();

  if (q.length < 2) return NextResponse.json({ results: [] });

  // ⚡ cortar temprano // 
const nq = norm(q); //normalizar 

const folders: SearchResult[] = [];
const files: SearchResult[] = [];

for (const item of FLAT) {
  if (!item.normName.includes(nq)) continue; // 👈 ideal usar normName precalculado
  (item.isFolder ? folders : files).push(item);
}
//primero ordenar carpetas y luego archivos
//orden alfabetico
folders.sort((a, b) => a.name.localeCompare(b.name, "es"));
files.sort((a, b) => a.name.localeCompare(b.name, "es"));

const results = folders.concat(files).slice(0, limit);

return NextResponse.json({ results });

}
