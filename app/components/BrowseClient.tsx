"use client";

import Link from "next/link";
import { useMemo } from "react";
import AnimatedList from "@/app/components/AnimatedList";

// Interfaces y Helpers (Copia los mismos que ya tenés)
interface Node {
  id: string;
  name: string;
  type: string;
  url?: string;
  children?: Node[];
}

const isFolder = (n: Node) => n.type === "folder" || n.type === "application/vnd.google-apps.folder";
const cleanName = (name: string) => name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");
const parseSeg = (seg: string) => {
  const idx = seg.indexOf("--");
  if (idx === -1) return { slug: "", id: seg };
  return { slug: seg.slice(0, idx), id: seg.slice(idx + 2) };
};

export default function BrowseClient({ fullTree, segs }: { fullTree: Node[], segs: string[] }) {
  
  // EL HASH MAP: Se crea una sola vez en el celular del alumno
  const nodeMap = useMemo(() => {
    const map = new Map<string, Node>();
    function index(nodes: Node[]) {
      for (const n of nodes) {
        map.set(n.id, n);
        if (n.children) index(n.children);
      }
    }
    index(fullTree);
    return map;
  }, [fullTree]);

  // Lógica de navegación instantánea
  const breadcrumbs = [{ name: "Inicio", href: "/" }];
  let pathAccumulator = "/browse";
  let currentNode: Node | null = null;

  for (const seg of segs) {
    const decoded = decodeURIComponent(seg);
    const { id } = parseSeg(decoded);
    const found = nodeMap.get(id);
    if (found) {
      currentNode = found;
      pathAccumulator += `/${encodeURIComponent(decoded)}`;
      breadcrumbs.push({ name: cleanName(found.name), href: pathAccumulator });
    }
  }

  const currentNodes = currentNode ? (currentNode.children ?? []) : fullTree;

  const sortedNodes = [...currentNodes].sort((a, b) => {
    const aIsF = isFolder(a);
    const bIsF = isFolder(b);
    if (aIsF && !bIsF) return -1;
    if (!aIsF && bIsF) return 1;
    return a.name.localeCompare(b.name, "es", { numeric: true, sensitivity: 'base' });
  });

  const backHref = segs.length <= 1 ? "/" : "/browse/" + segs.slice(0, -1).map(encodeURIComponent).join("/");

  return (
    <main className="mini">
      <Link className="back" href={backHref}>← Volver</Link>

      <nav className="miniCrumbs">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <span key={crumb.href} className="crumbWrap">
              {i > 0 && <span className="miniSep">›</span>}
              {isLast ? (
                <span className="miniCrumb active">{crumb.name}</span>
              ) : (
                <Link href={crumb.href} className="miniCrumb">{crumb.name}</Link>
              )}
            </span>
          );
        })}
      </nav>

      <h1 className="folderHeaderTitle">
        {currentNode ? cleanName(currentNode.name) : "Materias"}
      </h1>

      <AnimatedList childrenData={sortedNodes} segs={segs} />
    </main>
  );
}