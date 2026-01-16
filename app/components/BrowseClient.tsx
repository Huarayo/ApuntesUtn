"use client";

import { useEffect, useMemo, useState } from "react";
import AnimatedList from "@/app/components/AnimatedList";
import { useTree, type TreeNode } from "@/app/components/TreeLoader";

const isFolder = (n: TreeNode) =>
  n.type === "folder" || n.type === "application/vnd.google-apps.folder";

const cleanName = (name: string) =>
  name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const segOfFolder = (n: TreeNode) => `${slugify(n.name)}--${n.id}`;

function parseSeg(seg: string) {
  const idx = seg.indexOf("--");
  if (idx === -1) return { slug: "", id: seg };
  return { slug: seg.slice(0, idx), id: seg.slice(idx + 2) };
}

// Lee la URL actual y devuelve segs (/browse/a/b/c)
function readSegsFromPathname(): string[] {
  const p = window.location.pathname;
  if (!p.startsWith("/browse")) return [];
  const rest = p.slice("/browse".length); // "" o "/..."
  if (!rest) return [];
  return rest
    .split("/")
    .filter(Boolean)
    .map((s) => decodeURIComponent(s));
}

export default function BrowseClient({ segs }: { segs: string[] }) {
  const fullTree = useTree();

  // ✅ Estado local (navegación offline real)
  const [localSegs, setLocalSegs] = useState<string[]>(segs);

  // ✅ Si el usuario toca back/forward del navegador
  useEffect(() => {
    const onPop = () => setLocalSegs(readSegsFromPathname());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ✅ helper para navegar sin que Next haga fetch
  const goTo = (nextSegs: string[]) => {
    setLocalSegs(nextSegs);
    const url =
      nextSegs.length === 0
        ? "/browse"
        : "/browse/" + nextSegs.map(encodeURIComponent).join("/");
    window.history.pushState({}, "", url);
  };

  // ✅ Hook SIEMPRE llamado
  const TreeNodeMap = useMemo(() => {
    const map = new Map<string, TreeNode>();
    if (!fullTree) return map;

    function index(TreeNodes: TreeNode[]) {
      for (const n of TreeNodes) {
        if (n.id) map.set(n.id, n);
        if (n.children) index(n.children);
      }
    }

    index(fullTree);
    return map;
  }, [fullTree]);

  if (!fullTree) {
    return (
      <main className="mini">
        <p style={{ padding: 24, opacity: 0.7 }}>Cargando carpeta…</p>
      </main>
    );
  }

  // ✅ breadcrumbs offline
  const breadcrumbs: { name: string; segs: string[] }[] = [
    { name: "Materias", segs: [] },
  ];

  let currentTreeNode: TreeNode | null = null;
  for (let i = 0; i < localSegs.length; i++) {
    const decoded = decodeURIComponent(localSegs[i]);
    const { id } = parseSeg(decoded);
    const found = TreeNodeMap.get(id);
    if (found) {
      currentTreeNode = found;
      breadcrumbs.push({
        name: cleanName(found.name),
        segs: localSegs.slice(0, i + 1),
      });
    }
  }

  const currentTreeNodes = currentTreeNode ? currentTreeNode.children ?? [] : fullTree;

  const sortedTreeNodes = [...currentTreeNodes].sort((a, b) => {
    const aIsF = isFolder(a);
    const bIsF = isFolder(b);
    if (aIsF && !bIsF) return -1;
    if (!aIsF && bIsF) return 1;
    return a.name.localeCompare(b.name, "es", {
      numeric: true,
      sensitivity: "base",
    });
  });

  const backSegs = localSegs.length <= 1 ? [] : localSegs.slice(0, -1);

  return (
    <main className="mini">
      {/* ✅ Back offline */}
      <button className="back" onClick={() => goTo(backSegs)}>
        ← Volver
      </button>

      {/* ✅ Breadcrumb offline */}
      <nav className="miniCrumbs">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <span key={i} className="crumbWrap">
              {i > 0 && <span className="miniSep">›</span>}
              {isLast ? (
                <span className="miniCrumb active">{crumb.name}</span>
              ) : (
                <button
                  className="miniCrumb"
                  onClick={() => goTo(crumb.segs)}
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  {crumb.name}
                </button>
              )}
            </span>
          );
        })}
      </nav>

      <h1 className="folderHeaderTitle">
        {currentTreeNode ? cleanName(currentTreeNode.name) : "Materias"}
      </h1>

      {/* ✅ Lista offline: si es folder → goTo() */}
<AnimatedList
  childrenData={sortedTreeNodes}
  onFolderClick={(folderTreeNode) => {
    const next = [...localSegs, segOfFolder(folderTreeNode)];
    goTo(next);
  }}
/>

    </main>
  );
}




// "use client";

// import Link from "next/link";
// import { useMemo } from "react";
// import AnimatedList from "@/app/components/AnimatedList";
// import { useTree, TreeNode } from "@/app/components/TreeLoader"; // 👈 CAMBIAR si tu archivo se llama useTree.ts

// const isFolder = (n: TreeNode) =>
//   n.type === "folder" || n.type === "application/vnd.google-apps.folder";

// const cleanName = (name: string) =>
//   name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");

// const parseSeg = (seg: string) => {
//   const idx = seg.indexOf("--");
//   if (idx === -1) return { slug: "", id: seg };
//   return { slug: seg.slice(0, idx), id: seg.slice(idx + 2) };
// };

// export default function BrowseClient({ segs }: { segs: string[] }) {
//   const fullTree = useTree();

//   // ✅ Hook SIEMPRE llamado, aunque fullTree sea null
//   const TreeNodeMap = useMemo(() => {
//     const map = new Map<string, TreeNode>();
//     if (!fullTree) return map;

//     function index(TreeNodes: TreeNode[]) {
//       for (const n of TreeNodes) {
//         if (n.id) map.set(n.id, n);
//         if (n.children) index(n.children);
//       }
//     }

//     index(fullTree);
//     return map;
//   }, [fullTree]);

//   // ✅ ahora sí, loading abajo
//   if (!fullTree) {
//     return (
//       <main className="mini">
//         <p style={{ padding: 24, opacity: 0.7 }}>Cargando carpeta…</p>
//       </main>
//     );
//   }

//   const breadcrumbs = [{ name: "Inicio", href: "/" }];
//   let pathAccumulator = "/browse";
//   let currentTreeNode: TreeNode | null = null;

//   for (const seg of segs) {
//     const decoded = decodeURIComponent(seg);
//     const { id } = parseSeg(decoded);
//     const found = TreeNodeMap.get(id);

//     if (found) {
//       currentTreeNode = found;
//       pathAccumulator += `/${encodeURIComponent(decoded)}`;
//       breadcrumbs.push({ name: cleanName(found.name), href: pathAccumulator });
//     }
//   }

//   const currentTreeNodes = currentTreeNode ? (currentTreeNode.children ?? []) : fullTree;

//   const sortedTreeNodes = [...currentTreeNodes].sort((a, b) => {
//     const aIsF = isFolder(a);
//     const bIsF = isFolder(b);
//     if (aIsF && !bIsF) return -1;
//     if (!aIsF && bIsF) return 1;
//     return a.name.localeCompare(b.name, "es", {
//       numeric: true,
//       sensitivity: "base",
//     });
//   });

//   const backHref =
//     segs.length <= 1
//       ? "/"
//       : "/browse/" + segs.slice(0, -1).map(encodeURIComponent).join("/");

//   return (
//     <main className="mini">
//       <Link className="back" href={backHref}>
//         ← Volver
//       </Link>

//       <nav className="miniCrumbs">
//         {breadcrumbs.map((crumb, i) => {
//           const isLast = i === breadcrumbs.length - 1;
//           return (
//             <span key={crumb.href} className="crumbWrap">
//               {i > 0 && <span className="miniSep">›</span>}
//               {isLast ? (
//                 <span className="miniCrumb active">{crumb.name}</span>
//               ) : (
//                 <Link href={crumb.href} className="miniCrumb">
//                   {crumb.name}
//                 </Link>
//               )}
//             </span>
//           );
//         })}
//       </nav>

//       <h1 className="folderHeaderTitle">
//         {currentTreeNode ? cleanName(currentTreeNode.name) : "Materias"}
//       </h1>

//       <AnimatedList childrenData={sortedTreeNodes} segs={segs} />
//     </main>
//   );
// }


// "use client";

// import Link from "next/link";
// import { useMemo } from "react";
// import AnimatedList from "@/app/components/AnimatedList";

// // Interfaces y Helpers (Copia los mismos que ya tenés)
// interface TreeNode {
//   id: string;
//   name: string;
//   type: string;
//   url?: string;
//   children?: TreeNode[];
// }

// const isFolder = (n: TreeNode) => n.type === "folder" || n.type === "application/vnd.google-apps.folder";
// const cleanName = (name: string) => name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");
// const parseSeg = (seg: string) => {
//   const idx = seg.indexOf("--");
//   if (idx === -1) return { slug: "", id: seg };
//   return { slug: seg.slice(0, idx), id: seg.slice(idx + 2) };
// };

// export default function BrowseClient({ fullTree, segs }: { fullTree: TreeNode[], segs: string[] }) {
  
//   // EL HASH MAP: Se crea una sola vez en el celular del alumno
//   const TreeNodeMap = useMemo(() => {
//     const map = new Map<string, TreeNode>();
//     function index(TreeNodes: TreeNode[]) {
//       for (const n of TreeNodes) {
//         map.set(n.id, n);
//         if (n.children) index(n.children);
//       }
//     }
//     index(fullTree);
//     return map;
//   }, [fullTree]);

//   // Lógica de navegación instantánea
//   const breadcrumbs = [{ name: "Inicio", href: "/" }];
//   let pathAccumulator = "/browse";
//   let currentTreeNode: TreeNode | null = null;

//   for (const seg of segs) {
//     const decoded = decodeURIComponent(seg);
//     const { id } = parseSeg(decoded);
//     const found = TreeNodeMap.get(id);
//     if (found) {
//       currentTreeNode = found;
//       pathAccumulator += `/${encodeURIComponent(decoded)}`;
//       breadcrumbs.push({ name: cleanName(found.name), href: pathAccumulator });
//     }
//   }

//   const currentTreeNodes = currentTreeNode ? (currentTreeNode.children ?? []) : fullTree;

//   const sortedTreeNodes = [...currentTreeNodes].sort((a, b) => {
//     const aIsF = isFolder(a);
//     const bIsF = isFolder(b);
//     if (aIsF && !bIsF) return -1;
//     if (!aIsF && bIsF) return 1;
//     return a.name.localeCompare(b.name, "es", { numeric: true, sensitivity: 'base' });
//   });

//   const backHref = segs.length <= 1 ? "/" : "/browse/" + segs.slice(0, -1).map(encodeURIComponent).join("/");

//   return (
//     <main className="mini">
//       <Link className="back" href={backHref}>← Volver</Link>

//       <nav className="miniCrumbs">
//         {breadcrumbs.map((crumb, i) => {
//           const isLast = i === breadcrumbs.length - 1;
//           return (
//             <span key={crumb.href} className="crumbWrap">
//               {i > 0 && <span className="miniSep">›</span>}
//               {isLast ? (
//                 <span className="miniCrumb active">{crumb.name}</span>
//               ) : (
//                 <Link href={crumb.href} className="miniCrumb">{crumb.name}</Link>
//               )}
//             </span>
//           );
//         })}
//       </nav>

//       <h1 className="folderHeaderTitle">
//         {currentTreeNode ? cleanName(currentTreeNode.name) : "Materias"}
//       </h1>

//       <AnimatedList childrenData={sortedTreeNodes} segs={segs} />
//     </main>
//   );
// }