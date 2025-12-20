import Link from "next/link";
import treeRaw from "@/scripts/data/drive-tree.json";
import { redirect } from "next/navigation";

type Node = {
  id?: string;
  name: string;
  type: string; // "folder" o mimeType
  url?: string;
  children?: Node[];
};

const tree = treeRaw as Node[];

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
  return `${slugify(n.name)}--${n.id}`;
}

function parseSeg(seg: string) {
  const idx = seg.lastIndexOf("--");
  if (idx === -1) return { id: seg, slug: "" };
  return { id: seg.slice(idx + 2), slug: seg.slice(0, idx) };
}

function findChildrenByIds(root: Node[], ids: string[]) {
  let current = root;
  for (const id of ids) {
    const folder = current.find((n) => isFolder(n) && n.id === id);
    if (!folder?.children) return current;
    current = folder.children;
  }
  return current;
}

// Función para asignar íconos según el nombre
function getIcon(name: string, isFolder: boolean) {
  if (!isFolder) return "📄";
  const n = name.toLowerCase();
  if (n.includes("sistemas") || n.includes("arquitectura")) return "microchip"; // Podés usar íconos de Lucide o SVGs
  if (n.includes("numerica") || n.includes("codificacion")) return "binary";
  if (n.includes("memoria")) return "memory";
  return "folder";
}

  // Función para limpiar nombres (Ej: "1_Sistemas_Digitales" -> "Sistemas Digitales")
function cleanName(name: string) {
  return name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");
}

export default async function Page(props: {
  params: Promise<{ segments?: string[] }>;
}) {
  const { segments } = await props.params;
  const segs = segments ?? [];
  if (segs.length === 0) redirect("/");


  const ids = segs.map((s) => parseSeg(decodeURIComponent(s)).id);
  const current = findChildrenByIds(tree, ids);

  const sorted = [...current].sort((a, b) => {
    const af = isFolder(a) ? 0 : 1;
    const bf = isFolder(b) ? 0 : 1;
    if (af !== bf) return af - bf;
    return a.name.localeCompare(b.name, "es");
  });

  //BREADCRUMBS nivel por nivel
  const breadcrumbs = segs.map((_, index) => {
    //tomamos todos los elementos desde el inicio hasta el indice actual
    const currentSegs = segs.slice(0, index + 1);
    const { slug } = parseSeg(decodeURIComponent(segs[index]));

  return {
      name: cleanName(slug || "Carpeta"),
      href: "/browse/" + currentSegs.map(encodeURIComponent).join("/")
    };
  })

  // ✅ título carpeta actual (simple)
  const currentTitle = segs.length
    ? (parseSeg(decodeURIComponent(segs[segs.length - 1])).slug || "Carpeta").replace(/-/g, " ")
    : "Inicio";

  // ✅ volver 1 nivel (o al home si estás en root)
  const backHref =
  segs.length <= 1
    ? "/"
    : "/browse/" + segs.slice(0, -1).map(encodeURIComponent).join("/");

  
  return (
    <main className="mini">
      <Link  className="back" href={backHref}>← Volver</Link>

      {/* ✅ BREADCRUMBS INFINITOS */}
      <nav className="miniCrumbs">
        <Link href="/" className="miniCrumb">Inicio</Link>
        {breadcrumbs.map((crumb, i) => (
          <div key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span className="miniSep"> &gt; </span>
            <Link 
              href={crumb.href} 
              className={`miniCrumb ${i === breadcrumbs.length - 1 ? 'active' : ''}`}
            >
              {crumb.name}
            </Link>
          </div>
        ))}
      </nav>
      <h1 className="folderHeaderTitle">{currentTitle}</h1>

      {/* Resto de tu código (navBar y miniList) se mantiene igual */}
      

      <div className="miniList">
        {sorted.map((item) => {
          const isF = isFolder(item);
          const href = isF 
            ? "/browse/" + [...segs, segOfFolder(item)].map(encodeURIComponent).join("/")
            : item.url;

          return (
            <Link key={item.id ?? item.name} href={href || "#"} className="miniRow">
              <div className="miniRowLeft">
                <span className={`iconIcon ${isF ? 'folder' : 'file'}`}>
                  {isF ? "📁" : "📄"} 
                </span>
                <span className="miniName">{cleanName(item.name)}</span>
              </div>
              <span className="miniRight">
                {isF ? (
                  /* Icono Chevron (Flecha hacia la derecha) para carpetas */
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                ) : (
                  /* Icono de Enlace Externo para archivos */
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
                  </svg>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
