import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getNodeById,
  getRootChildren,
  getRootId,
  isChildOf,
  isFolder,
  type Node,
} from "@/app/lib/driveIndex";

import FolderIcon from "../../components/icons/Folder";
import FileIcon from "../../components/icons/FileIcon";

function cleanName(name: string) {
  return name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");
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
  return `${slugify(n.name)}--${n.id}`;
}

function extractId(seg: string) {
  const decoded = decodeURIComponent(seg);
  const i = decoded.lastIndexOf("--");
  return i === -1 ? null : decoded.slice(i + 2);
}

function sortNodes(list: Node[]) {
  return [...list].sort((a, b) => {
    const af = isFolder(a) ? 0 : 1;
    const bf = isFolder(b) ? 0 : 1;
    if (af !== bf) return af - bf;
    return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const { segments } = await params;
  const segs = segments ?? [];

  // validar ruta completa
  let parentId = getRootId();
  let currentChildren: Node[] = getRootChildren();
  let currentNode: Node | null = null;

  for (const s of segs) {
    const id = extractId(s);
    if (!id) redirect("/browse");

    if (!isChildOf(parentId, id)) redirect("/browse");

    const node = getNodeById(id);
    if (!node || !isFolder(node)) redirect("/browse");

    currentNode = node;
    parentId = id;
    currentChildren = node.children ?? [];
  }

  const children = sortNodes(currentChildren);

  const breadcrumbs = segs.map((seg, index) => {
    const id = extractId(seg);
    const node = id ? getNodeById(id) : null;

    return {
      name: node ? cleanName(node.name) : "Carpeta",
      href: "/browse/" + segs.slice(0, index + 1).map(encodeURIComponent).join("/"),
    };
  });

  const currentTitle = currentNode ? cleanName(currentNode.name) : "Inicio";

  const backHref =
    segs.length <= 1
      ? "/"
      : "/browse/" + segs.slice(0, -1).map(encodeURIComponent).join("/");

  return (
    <main className="mini">
      <Link className="back" href={backHref}>
        ← Volver
      </Link>

      <nav className="miniCrumbs">
        <Link href="/" className="miniCrumb">
          Inicio
        </Link>

        {breadcrumbs.map((crumb, i) => {
          const last = i === breadcrumbs.length - 1;
          return (
            <span key={crumb.href} className="crumbWrap">
              <span className="miniSep">›</span>
              {last ? (
                <span className="miniCrumb active" aria-current="page">
                  {crumb.name}
                </span>
              ) : (
                <Link href={crumb.href} className="miniCrumb">
                  {crumb.name}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <h1 className="folderHeaderTitle">{currentTitle}</h1>

      <div className="miniList">
        {children.map((item) => {
          const folder = isFolder(item);

          const href = folder
            ? `/browse/${[...segs, segOfFolder(item)].map(encodeURIComponent).join("/")}`
            : item.url;

          return (
            <a
              key={item.id ?? item.name}
              href={href ?? "#"}
              className="miniRow"
              target={folder ? "_self" : "_blank"}
              rel="noopener noreferrer"
            >
              <div className="miniRowLeft">
                <span className={`iconIcon ${folder ? "folder" : "file"}`}>
                  {folder ? <FolderIcon size={35} /> : <FileIcon size={45} />}
                </span>
                <span className="miniName">{cleanName(item.name)}</span>
              </div>

              <span className="miniRight">
                {folder ? "›" : "↗"}
              </span>
            </a>
          );
        })}
      </div>
    </main>
  );
}


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

