import type { Metadata } from "next";
import BrowseClient from "@/app/components/BrowseClient";

import fs from "fs";
import path from "path";
import { cache } from "react";

// --- INTERFAZ ---
interface Node {
  id: string;
  name: string;
  type: string;
  url?: string;
  children?: Node[];
}

// --- HELPERS ---
const cleanName = (name: string) => name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const parseSeg = (seg: string) => {
  const idx = seg.indexOf("--");
  return idx === -1 ? { id: seg } : { id: seg.slice(idx + 2) };
};

const isFolder = (n: Node) =>
  n.type === "folder" || n.type === "application/vnd.google-apps.folder";

// ✅ lee el JSON desde public y lo cachea (para metadata/static params)
const getTree = cache((): Node[] => {
  const filePath = path.join(process.cwd(), "public", "data", "drive-tree-v2.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as Node[];
});

const findName = (nodes: Node[], targetId: string): string | null => {
  for (const n of nodes) {
    if (n.id === targetId) return n.name;
    if (n.children) {
      const res = findName(n.children, targetId);
      if (res) return res;
    }
  }
  return null;
};

// ----- generar miles de rutas para google
export async function generateMetadata({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}): Promise<Metadata> {
  const { segments } = await params;
  const tree = getTree();

  // 1. Caso Base: /browse (Página principal de materias)
  if (!segments || segments.length === 0) {
    return { 
      title: "Materias y Carreras | Apuntes UTN Mendoza",
      description: "Explorá todas las carreras de la UTN FRM: Ingeniería Sistemas, Civil, Electromecánica y más. Todo el material organizado en un solo lugar."
    };
  }

  // Helper interno para obtener el nombre real desde el ID del segmento
  const getRealName = (seg: string) => {
    const { id } = parseSeg(decodeURIComponent(seg));
    const raw = findName(tree, id);
    return raw ? cleanName(raw) : null;
  };

  const nombreActual = getRealName(segments[segments.length - 1]);
  const nombreCarrera = getRealName(segments[0]);

  // Si algo falla, fallback seguro
  if (!nombreActual) return { title: "Carpeta | Apuntes UTN Mendoza" };

  let tituloFinal = "";
  let descFinal = "";

  // 2. Lógica según la profundidad de la URL (lo que me pasaste en el ejemplo)
  if (segments.length === 1) {
    // Nivel 1: Carrera (Ej: BÁSICAS)
    tituloFinal = `${nombreActual.toUpperCase()} | Apuntes UTN Mendoza`;
    descFinal = `Accedé a todo el material organizado para la carrera de ${nombreActual} en la UTN Facultad Regional Mendoza.`;
  } 
  else if (segments.length === 2) {
    // Nivel 2: Materia (Ej: ANÁLISIS MATEMÁTICO I)
    tituloFinal = `${nombreActual.toUpperCase()} | ${nombreCarrera}`;
    descFinal = `Apuntes, parciales y finales de ${nombreActual} para estudiantes de ${nombreCarrera}. La forma más fácil de estudiar.`;
  } 
  else {
    // Nivel 3 o más: Subcarpeta (Ej: EXÁMENES)
    const nombreMateria = getRealName(segments[1]);
    tituloFinal = `${nombreActual.toUpperCase()} - ${nombreMateria} | ${nombreCarrera}`;
    descFinal = `Sección de ${nombreActual} para la materia ${nombreMateria}. Material actualizado y organizado por la comunidad de la UTN.`;
  }

  return {
    title: tituloFinal,
    description: descFinal,
    alternates: {
      canonical: `/browse/${segments.join('/')}`,
    },
  };
}



// // --- SEO ---
// export async function generateMetadata({
//   params,
// }: {
//   params: Promise<{ segments?: string[] }>;
// }): Promise<Metadata> {
//   const { segments } = await params;

//   if (!segments || segments.length === 0) return { title: "Materias" };

//   const lastSeg = decodeURIComponent(segments[segments.length - 1]);
//   const { id } = parseSeg(lastSeg);

//   const tree = getTree();
//   const name = findName(tree, id);

//   return { title: name ? cleanName(name).toUpperCase() : "Carpeta" };
// }

// --- GENERACIÓN ESTÁTICA (SOLO PRINCIPALES) ---
// export async function generateStaticParams() {
//   const tree = getTree();

//   return tree
//     .filter((n) => isFolder(n) && n.id)
//     .map((n) => ({
//       segments: [`${slugify(n.name)}--${n.id}`],
//     }));
// }
// --- 5. MOTOR DE VELOCIDAD (Generación hasta Nivel 4) ---
export async function generateStaticParams() {
  const tree = getTree();
  const paths: { segments: string[] }[] = [];

  // Función recursiva que "camina" el árbol
  function walk(nodes: Node[], currentSegments: string[], depth: number) {
    // Si llegamos al nivel 4 o no hay más nodos, nos detenemos
    if (depth > 4 || !nodes) return;

    for (const node of nodes) {
      if (isFolder(node)) {
        const segment = `${slugify(node.name)}--${node.id}`;
        const newSegments = [...currentSegments, segment];
        
        // Agregamos esta ruta a la lista de páginas para pre-generar
        paths.push({ segments: newSegments });

        // Si tiene hijos, seguimos bajando un nivel más
        if (node.children) {
          walk(node.children, newSegments, depth + 1);
        }
      }
    }
  }

  // Empezamos a caminar desde la raíz (Nivel 1)
  walk(tree, [], 1);

  return paths;
}
export const dynamicParams = true;

// --- LA PÁGINA ---
export default async function Page({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const { segments } = await params;
  return <BrowseClient segs={segments ?? []} />;
}

  // ... acá sigue tu código actual tal como lo tenías

//--------------------------------------------------

// import { Metadata } from "next";
// import treeRaw from "@/scripts/data/drive-tree.json";
// // Si el error de "Module not found" persiste, asegurate de que el archivo 
// // exista en: app/components/BrowseClient.tsx
// import BrowseClient from "@/app/components/BrowseClient";



// // --- INTERFAZ (El "Contrato") ---
// // Esto elimina todos los errores de "any"
// interface Node {
//   id: string;
//   name: string;
//   type: string;
//   url?: string;
//   children?: Node[];
// }

// // --- HELPERS ---
// const cleanName = (name: string) => name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");

// const slugify = (s: string) => 
//   s.toLowerCase()
//    .normalize("NFD")
//    .replace(/[\u0300-\u036f]/g, "")
//    .replace(/[^a-z0-9]+/g, "-")
//    .replace(/(^-|-$)/g, "");

// const parseSeg = (seg: string) => {
//   const idx = seg.indexOf("--");
//   return idx === -1 ? { id: seg } : { id: seg.slice(idx + 2) };
// };

// const isFolder = (n: Node) => n.type === "folder" || n.type === "application/vnd.google-apps.folder";

// // --- SEO ---
// export async function generateMetadata({ params }: { params: Promise<{ segments?: string[] }> }): Promise<Metadata> {
//   const { segments } = await params;
//   if (!segments || segments.length === 0) return { title: "Materias" };
  
//   const lastSeg = decodeURIComponent(segments[segments.length - 1]);
//   const { id } = parseSeg(lastSeg);
  
//   // Reemplazamos 'any' por 'Node' o 'Node[]'
//   const findName = (nodes: Node[], targetId: string): string | null => {
//     for (const n of nodes) {
//       if (n.id === targetId) return n.name;
//       if (n.children) {
//         const res = findName(n.children, targetId);
//         if (res) return res;
//       }
//     }
//     return null;
//   };

//   const name = findName(treeRaw as Node[], id);
//   return { title: name ? cleanName(name).toUpperCase() : "Carpeta" };
// }

// // --- GENERACIÓN ESTÁTICA ---
// export async function generateStaticParams() {
//   // Tipamos el mapeo para evitar errores
//   return (treeRaw as Node[])
//     .filter(isFolder)
//     .map((node: Node) => ({
//       segments: [`${slugify(node.name)}--${node.id}`],
//     }));
// }

// export const dynamicParams = true;

// // --- LA PÁGINA ---
// export default async function Page({ params }: { params: Promise<{ segments?: string[] }> }) {
//   const { segments } = await params;
  
//   // Usamos el casteo (as Node[]) para que TypeScript esté tranquilo
//   return <BrowseClient fullTree={treeRaw as Node[]} segs={segments ?? []} />;
// }

//-----------------------------------------------------------

// import { Metadata } from "next";
// import Link from "next/link";
// import { notFound } from "next/navigation"; // Importación que faltaba
// import treeRaw from "@/scripts/data/drive-tree.json";
// import AnimatedList from "@/app/components/AnimatedList"; // Importación que faltaba

// // --- INTERFACES ---
// interface Node {
//   id: string;
//   name: string;
//   type: string;
//   url?: string;
//   children?: Node[]; // Esto soluciona el error de 'children'
// }

// // --- FUNCIONES HELPER (Tus herramientas de trabajo) ---
// const isFolder = (n: Node) => n.type === "folder" || n.type === "application/vnd.google-apps.folder";
// const cleanName = (name: string) => name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");
// const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
// const segOfFolder = (n: Node) => `${slugify(n.name)}--${n.id}`;

// function parseSeg(seg: string) {
//   const idx = seg.indexOf("--");
//   if (idx === -1) return { slug: "", id: seg };
//   return { slug: seg.slice(0, idx), id: seg.slice(idx + 2) };
// }

// // --- EL HASH MAP (Búsqueda Instantánea O(1)) ---
// const nodeMap = new Map<string, Node>();

// function indexNodes(nodes: Node[]) {
//   for (const node of nodes) {
//     nodeMap.set(node.id, node);
//     if (node.children) indexNodes(node.children);
//   }
// }

// // Ejecutamos el índice una sola vez
// indexNodes(treeRaw as Node[]);

// // --- GENERACIÓN ESTÁTICA ---
// // ESTO CAMBIA EL BUILD: De 563 páginas a solo ~13
// export async function generateStaticParams() {
//   return (treeRaw as Node[])
//     .filter(isFolder)
//     .map((node) => ({
//       segments: [segOfFolder(node)],
//     }));
// }

// // Agregá esta línea justo debajo para que las subcarpetas funcionen igual
// export const dynamicParams = true;

// // --- SEO ---
// export async function generateMetadata({ params }: { params: Promise<{ segments?: string[] }> }): Promise<Metadata> {
//   const { segments } = await params;
//   if (!segments || segments.length === 0) return { title: "Materias" };
//   const lastSeg = decodeURIComponent(segments[segments.length - 1]);
//   const { id } = parseSeg(lastSeg);
//   const node = nodeMap.get(id);
//   return { title: node ? cleanName(node.name).toUpperCase() : "Carpeta" };
// }

// // --- LA PÁGINA ---
// export default async function Page({ params }: { params: Promise<{ segments?: string[] }> }) {
//   const { segments } = await params;
//   const segs = segments ?? [];
  
//   const breadcrumbs = [{ name: "Inicio", href: "/" }];
//   let pathAccumulator = "/browse";
//   let currentNode: Node | null = null;

//   for (const seg of segs) {
//     const decoded = decodeURIComponent(seg);
//     const { id } = parseSeg(decoded);
//     const found = nodeMap.get(id);
    
//     if (!found) return notFound(); // Esto ahora funcionará
    
//     currentNode = found;
//     pathAccumulator += `/${encodeURIComponent(decoded)}`;
//     breadcrumbs.push({ name: cleanName(found.name), href: pathAccumulator });
//   }

//   // Obtenemos los hijos del nodo actual o la raíz
//   const currentNodes = currentNode ? (currentNode.children ?? []) : (treeRaw as Node[]);

//   // Ordenamos: Carpetas primero, luego Alfabético
//   const sortedNodes = [...currentNodes].sort((a, b) => {
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
//         {currentNode ? cleanName(currentNode.name) : "Materias"}
//       </h1>

//       <AnimatedList childrenData={sortedNodes} segs={segs} />
//     </main>
//   );
// }



// import Link from "next/link";
// import treeRaw from "@/scripts/data/drive-tree.json";
// import { redirect } from "next/navigation";
// import FolderIcon from "../../components/icons/Folder";
// import FileIcon from "../../components/icons/FileIcon";
// type Node = {
//   id?: string;
//   name: string;
//   type: string; // "folder" o mimeType
//   url?: string;
//   children?: Node[];
// };

// const tree = treeRaw as Node[];

// function isFolder(n: Node) {
//   return n.type === "folder" || n.type === "application/vnd.google-apps.folder";
// }

// //carpetas que tengo nombres parecidos los lleva al mismo formato
// function slugify(s: string) {
//   return s
//     .toLowerCase()
//     .normalize("NFD")
//     .replace(/[\u0300-\u036f]/g, "")
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/(^-|-$)/g, "");
// }

// function segOfFolder(n: Node) {
//   return `${slugify(n.name)}--${n.id}`;
// }

// function parseSeg(seg: string) {
//   const idx = seg.indexOf("--"); // primer separador
//   if (idx === -1) return { slug: "", id: seg };
//   return { slug: seg.slice(0, idx), id: seg.slice(idx + 2) };
// }


// function findChildrenByIds(root: Node[], ids: string[]) {
//   let current = root;
//   for (const id of ids) {
//     const folder = current.find((n) => isFolder(n) && n.id === id);
    
//     //a donde ir segun lo que se ponga en la ruta
//     //ej: basicas/jfñdfjañslk no encuentra nada y muestra lo que hay en basicas
//     //evitar mostrar algo cuando es error
//     // if (!folder?.children) return current;
//     // current = folder.children;
//     if(!folder) return null; //si es ruta invalida no existe
//     current = folder.children ?? [] //existe pero esta vacil []
//   }

//   return current;
// }

//   // solo hagarra el slug // Función para limpiar nombres (Ej: "1_Sistemas_Digitales" -> "Sistemas Digitales")
// function cleanName(name: string) {
//   return name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");
// }

// function findNodeById(root: Node[], id: string): Node | null {
//   for (const n of root) {
//     if (n.id === id) return n;
//     if (n.children) {
//       const hit = findNodeById(n.children, id);
//       if (hit) return hit;
//     }
//   }
//   return null;
// }

// //si le pasamos props decimos a next que nos pase lo que tenga en esta pagina
// export default async function Page(props: {
//   params: Promise<{ segments?: string[] }>;
// }) {
//   // accedemos al array con el nombre de la ruta 
//   //app/browse/[...segments]/page.tsx
//   //Todo lo que venga después de /browse/ metolo en el array llamado segments

//   const { segments } = await props.params;
//   const segs = segments ?? [];
//   if (segs.length === 0) redirect("/");


//   const ids = segs.map((s) => parseSeg(decodeURIComponent(s)).id);
//   const current = findChildrenByIds(tree, ids);
//   if(!current) redirect("/");

//   const sorted = [...current].sort((a, b) => {
//     const af = isFolder(a) ? 0 : 1;
//     const bf = isFolder(b) ? 0 : 1;
//     if (af !== bf) return af - bf;
//     return a.name.localeCompare(b.name, "es");
//   });

//     const breadcrumbs = segs.map((seg, index) => {
//     const currentSegs = segs.slice(0, index + 1);

//     const decoded = decodeURIComponent(seg);
//     const { id } = parseSeg(decoded);

//     const node = findNodeById(tree, id); 
//     //si no existe carpeta al hacer click no se puede construir la url
//     //por eso no redirije , es como un bug 
//     //["basicas--ID", "lo-que-sea--FAKEID"]

//     return {
//       name: node ? cleanName(node.name) : "Carpeta",
//       href: "/browse/" + currentSegs.map(encodeURIComponent).join("/"),
//       };
//     });


//   // ✅ título carpeta actual (simple)  
//     // ✅ título carpeta actual (nombre real)
//   const lastId = segs.length
//     ? parseSeg(decodeURIComponent(segs.at(-1)!)).id
//     : null;

//   const lastNode = lastId ? findNodeById(tree, lastId) : null;

//   const currentTitle = lastNode
//     ? cleanName(lastNode.name)
//     : "Carpeta";

  
//   // ✅ volver 1 nivel (o al home si estás en root)
//   const backHref =
//   segs.length <= 1
//     ? "/"
//     : "/browse/" + segs.slice(0, -1).map(encodeURIComponent).join("/");

//   return (
//     <main className="mini">
//       <Link  className="back" href={backHref}>← Volver</Link>

//       {/* ✅ BREADCRUMBS INFINITOS */}
//       <nav className="miniCrumbs">
//         <Link href="/" className="miniCrumb">Inicio</Link>
//         {breadcrumbs.map((crumb, i) => {
//           const last = i === breadcrumbs.length - 1;
//           return (
//             <span key={i} className="crumbWrap">
//               <span className="miniSep">›</span>
//               {last ? (
//                 <span className="miniCrumb active" aria-current="page">{crumb.name}</span>
//               ) : (
//                 <Link href={crumb.href} className="miniCrumb">{crumb.name}</Link>
//               )}
//             </span>
//           );
//         })}
//       </nav>
//       <h1 className="folderHeaderTitle">{currentTitle}</h1>

//       {/* Resto de tu código (navBar y miniList) se mantiene igual */}
      

//       <div className="miniList">
      
//         {sorted.map((item) => {
//           const isF = isFolder(item);
//           const href = isF 
//             ? "/browse/" + [...segs, segOfFolder(item)].map(encodeURIComponent).join("/")
//             : item.url;

//           return (
//             //esta mal usar Link para archivos externos
//             <a key={item.id ?? item.name} href={href || "#"} className="miniRow" target={isF ? "_self" : "_blank"} rel="noopener noreferrer">
//               <div className="miniRowLeft">
//                 <span className={`iconIcon ${isF ? 'folder' : 'file'}`}>
//                   {isF ? <FolderIcon size={35} />: <FileIcon size={45} />} 
//                 </span>
//                 <span className="miniName">{cleanName(item.name)}</span>
//               </div>
//               <span className="miniRight">
//                 {isF ? (
//                   /* Icono Chevron (Flecha hacia la derecha) para carpetas */
//                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                     <path d="m9 18 6-6-6-6"/>
//                   </svg>
//                 ) : (
//                   /* Icono de Enlace Externo para archivos */
//                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                     <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
//                   </svg>
//                 )}
//               </span>
//             </a>
//           );
//         })}
//       </div>
//     </main>
//   );

// }

