"use client"; // Necesario para usar useState

import { useState } from "react";
import Link from "next/link";
import treeRaw from "@/scripts/data/drive-tree.json";
import SearchBox from "@/app/components/SearchBox";

type Node = {
  id?: string;
  name: string;
  type: string;
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

// Función para limpiar nombres (quitar 1_, 2_, etc)
function cleanName(name: string) {
  return name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");
}

export default function Home() {
  // Estado para los resultados de búsqueda. null = no se buscó nada.
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  const topFolders = tree
    .filter((n) => isFolder(n) && n.id)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <main className="homeWrap">
      <section className="homeHero">
        <h1 className="homeTitle">
          Apuntes UTN <span>Mendoza</span>
        </h1>
        {/* Pasamos la función para actualizar los resultados al buscador */}
        <SearchBox onSearch={(data) => setSearchResults(data)} />
      </section>

      {/* RENDERIZADO CONDICIONAL */}
      {searchResults === null ? (
        /* VISTA INICIAL: Solo se ve si no hay búsqueda activa */
        <>
          <h2 className="homeSectionTitle">Materias</h2>
          <section className="homeList">
            {topFolders.map((f) => {
              const href = "/browse/" + encodeURIComponent(segOfFolder(f));
              return (
                <Link key={f.id} href={href} prefetch={false} className="homeRow">
                  <div className="homeRowLeft">
                    <div className="homeFolderIcon">📁</div>
                    <div className="homeRowText">{cleanName(f.name)}</div>
                  </div>
                  <div className="homeRowRight">▾</div>
                </Link>
              );
            })}
          </section>
        </>
      ) : (
        /* VISTA DE RESULTADOS: Reemplaza a la lista de materias */
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 className="homeSectionTitle">Resultados ({searchResults.length})</h2>
            <button 
              onClick={() => setSearchResults(null)} 
              className="btnLimpiar"
              style={{ background: 'none', border: 'none', color: 'var(--green)', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Volver a materias
            </button>
          </div>
          
          <section className="homeList animate-fade">
            {searchResults.length > 0 ? (
              searchResults.map((res, i) => (
                <Link 
                  key={i} 
                  href={res.href} 
                  className="homeRow"
                  target={res.isFolder ? "_self" : "_blank"}
                >
                  <div className="homeRowLeft">
                    <div className="homeFolderIcon">{res.isFolder ? "📁" : "📄"}</div>
                    <div className="homeRowText">{cleanName(res.name)}</div>
                  </div>
                  <div className="homeRowRight">{res.isFolder ? "→" : "↗"}</div>
                </Link>
              ))
            ) : (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                No encontramos nada con ese nombre. 😕
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}