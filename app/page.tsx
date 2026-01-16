"use client";

import { useState } from "react";
import Link from "next/link";
import treeRaw from "@/scripts/data/drive-tree.json";
import SearchBox from "@/app/components/SearchBox";
import FolderHome from "@/app/components/icons/FolderHome";
import FolderIcons from "./components/icons/FolderIcons";

// --- TIPOS ---
type Node = {
  id?: string;
  name: string;
  type: string;
  url?: string;
  children?: Node[];
};

type SearchResult = {
  id?: string;
  name: string;
  href: string;
  isFolder: boolean;
};

const tree = treeRaw as Node[];

// --- HELPERS ---
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

function cleanName(name: string) {
  return name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");
}

// --- COMPONENTE PRINCIPAL ---
export default function Home() {
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

  const topFolders = tree
    .filter((n) => isFolder(n) && n.id)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <main className="homeWrap">
      <section className="homeHero">
        <h1 className="homeTitle">
          Apuntes UTN <span>Mendoza</span>
        </h1>
        <SearchBox onSearch={(data) => setSearchResults(data)} />
      </section>

      {/* RENDERIZADO CONDICIONAL */}
      {searchResults === null ? (
        <>
          <h2 className="homeSectionTitle">Materias</h2>
          <section className="homeList">
            {topFolders.map((f) => {
              const href = "/browse/" + encodeURIComponent(segOfFolder(f));
              return (
                <Link key={f.id} href={href} prefetch={false} className="homeRow">
                  <div className="homeRowLeft">
                    <div className="homeFolderIcon"><FolderHome size={40} /></div>
                    <div className="homeRowText">{cleanName(f.name)}</div>
                  </div>
                  <div className="homeRowRight">▾</div>
                </Link>
              );
            })}
          </section>
        </>
      ) : (
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
                  prefetch={false}
                  className="homeRow"
                  target={res.isFolder ? "_self" : "_blank"}
                  rel={res.isFolder ? undefined : "noopener noreferrer"}
                >
                  <div className="homeRowLeft">
                    {/* FIJATE AQUÍ: El cierre correcto del div homeFolderIcon */}
                    <div className="homeFolderIcon">
                      {res.isFolder ? <FolderHome size={35} /> : <FolderIcons name={res.name} size={35} />}
                    </div>
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