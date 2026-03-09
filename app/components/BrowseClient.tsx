"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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

  //NUEVOS ESTADOS para la previsualización
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const [rotation, setRotation] = useState(0);

  const handleRotate = () => {
    setRotation((prev) => prev + 90)
  };

  const handleFileClick = (id: string) => {
    setRotation(0);
    setSelectedFileId(id);
    setIsPreviewOpen(true)
  };


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

// ✅ COMBINAMOS TODO EN UN SOLO BLOQUE ESTABLE
// Esto soluciona el error de "not iterable" y el de "manual memoization"
const { sortedTreeNodes, currentFiles } = useMemo(() => {
  // 1. Definimos los nodos base (si fullTree es null, usamos array vacío [])
  const baseNodes = currentTreeNode ? (currentTreeNode.children ?? []) : (fullTree ?? []);  

  // 2. Creamos la lista ordenada
  const sorted = [...baseNodes].sort((a, b) => {
    const aIsF = isFolder(a);
    const bIsF = isFolder(b);
    if (aIsF && !bIsF) return -1;
    if (!aIsF && bIsF) return 1;
    return a.name.localeCompare(b.name, "es", {
      numeric: true,
      sensitivity: "base",
    });
  });  

  // 3. Filtramos los archivos para el carrusel
  const files = sorted.filter(node => !isFolder(node));

  return { sortedTreeNodes: sorted, currentFiles: files };
}, [currentTreeNode, fullTree]);

  const navigateFile = useCallback((direction: "next" | "prev") => {
    const currentIndex = currentFiles.findIndex(f => f.id === selectedFileId);
    if (currentIndex === -1) return;
    const nextIndex = direction === "next" 
      ? (currentIndex + 1) % currentFiles.length 
      : (currentIndex - 1 + currentFiles.length) % currentFiles.length;
    setSelectedFileId(currentFiles[nextIndex].id!);
  }, [currentFiles, selectedFileId]);

  useEffect(() => {
    if (!isPreviewOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") navigateFile("next");
      if (e.key === "ArrowLeft") navigateFile("prev");
      if (e.key === "Escape") setIsPreviewOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPreviewOpen, navigateFile]); // Agregamos navigateFile aquí

 

  if (!fullTree) {
    return (
      <main className="mini">
        <p style={{ padding: 24, opacity: 0.7 }}>Cargando carpeta…</p>
      </main>
    );
  }

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

      {/* ✅ CONEXIÓN: Pasamos handleFileClick a la lista */}
      <AnimatedList
        childrenData={sortedTreeNodes}
        onFolderClick={(folderTreeNode) => {
          const next = [...localSegs, segOfFolder(folderTreeNode)];
          goTo(next);
        }}
        onFileClick={handleFileClick} // 👈 Agrega esta línea
      />

      {/* ✅ MODAL: Se mantiene igual al final */}
      {/* ✅ MODAL CON NAVEGACIÓN IZQUIERDA/DERECHA */}
      {isPreviewOpen && selectedFileId && (
        <div className="modal-overlay" onClick={() => setIsPreviewOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            
            {/* BARRA SUPERIOR: Contador y Cerrar */}
            <div className="modal-header">
              <button className="nav-btn" onClick={handleRotate} title="Rotar 90°">
                  <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24"><g className="rotate-left-outline"><g fill="currentColor" fillRule="evenodd" className="Vector" clipRule="evenodd"><path d="M12 6.05c3.869 0 7 3.126 7 6.975C19 16.875 15.869 20 12 20s-7-3.126-7-6.975c0-1.07.242-2.083.673-2.987a1 1 0 0 0-1.806-.86A8.9 8.9 0 0 0 3 13.024C3 17.985 7.032 22 12 22s9-4.015 9-8.975s-4.032-8.974-9-8.974c-1.24 0-2.425.25-3.502.705l.777 1.843A7 7 0 0 1 12 6.05"></path><path d="M10.194 2.233a.857.857 0 0 0-1.15.385L7.713 5.301a1.086 1.086 0 0 0 .493 1.456l2.691 1.329a.857.857 0 1 0 .758-1.536L9.53 5.5l1.053-2.118a.857.857 0 0 0-.388-1.149Z"></path></g></g></svg>
              </button>

              <div className="option">
                <a 
                  href={`https://drive.google.com/uc?export=download&id=${selectedFileId}`}
                  className="btn_descarga download-btn"
                  title="Descargar este archivo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="144px" height="144px" viewBox="0 0 24 24"><path fill="currentColor" d="m12 16l-5-5l1.4-1.45l2.6 2.6V4h2v8.15l2.6-2.6L17 11zm-6 4q-.825 0-1.412-.587T4 18v-3h2v3h12v-3h2v3q0 .825-.587 1.413T18 20z"/></svg>
                </a>
                <span className="file-counter">
                  {currentFiles.findIndex(f => f.id === selectedFileId) + 1} / {currentFiles.length}
                </span>
              </div>

              <button className="close-btn" onClick={() => setIsPreviewOpen(false)}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 64 64"><path fill="currentColor" d="M62 10.571L53.429 2L32 23.429L10.571 2L2 10.571L23.429 32L2 53.429L10.571 62L32 40.571L53.429 62L62 53.429L40.571 32z"/></svg></button>
          
            </div>


            <div className="preview-body">
             <button className="nav-arrow prev" onClick={() => navigateFile("prev")} title="Anterior">
                ◀
              </button>


              {/* VISOR DE DRIVE */}
              <iframe
                src={`https://drive.google.com/file/d/${selectedFileId}/preview`}
                width="100%"
                height="100%"
                style={{ 
                  border: "none",
                  // ✅ AQUÍ SE APLICA LA MAGIA
                  transform: `rotate(${rotation}deg)`,
                  transition: "transform 0.3s ease" // Para que gire suave
                }}
                allow="autoplay"
              />
              <button className="nav-arrow next" onClick={() => navigateFile("next")} title="Siguiente">
                ▶
              </button>

            </div>
          </div>
        </div>
      )}
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