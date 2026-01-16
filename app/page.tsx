"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import SearchBox from "@/app/components/SearchBox";
import FolderHome from "@/app/components/icons/FolderHome";
import FolderIcons from "./components/icons/FolderIcons";
import { useTree, type TreeNode } from "@/app/components/TreeLoader";

type SearchResult = {
  id?: string;
  name: string;
  href: string;
  isFolder: boolean;
};

function isFolder(n: TreeNode) {
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

function segOfFolder(n: TreeNode) {
  return `${slugify(n.name)}--${n.id}`;
}

function cleanName(name: string) {
  return name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");
}

export default function Home() {
  const tree = useTree();
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

  // ✅ Hook SIEMPRE llamado
  const topFolders = useMemo(() => {
    if (!tree) return [];
    return tree
      .filter((n) => isFolder(n) && n.id)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [tree]);

  // ✅ ahora sí, loading abajo
  if (!tree) {
    return (
      <main className="homeWrap">
        <section className="homeHero">
          <h1 className="homeTitle">
            Apuntes UTN <span>Mendoza</span>
          </h1>
          <p style={{ opacity: 0.7 }}>Cargando materias…</p>
        </section>
      </main>
    );
  }

  return (
    <main className="homeWrap">
      <section className="homeHero">
        <h1 className="homeTitle">
          Apuntes UTN <span>Mendoza</span>
        </h1>
        <SearchBox onSearch={(data) => setSearchResults(data)} />
      </section>

      {searchResults === null ? (
        <>
          <h2 className="homeSectionTitle">Materias</h2>
          <section className="homeList">
            {topFolders.map((f) => {
              const href = "/browse/" + encodeURIComponent(segOfFolder(f));
              return (
                <Link key={f.id} href={href} className="homeRow">
                  <div className="homeRowLeft">
                    <div className="homeFolderIcon">
                      <FolderHome size={40} />
                    </div>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h2 className="homeSectionTitle">Resultados ({searchResults.length})</h2>
            <button
              onClick={() => setSearchResults(null)}
              className="btnLimpiar"
              style={{
                background: "none",
                border: "none",
                color: "var(--green)",
                fontWeight: "bold",
                cursor: "pointer",
              }}
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
                  rel={res.isFolder ? undefined : "noopener noreferrer"}
                >
                  <div className="homeRowLeft">
                    <div className="homeFolderIcon">
                      {res.isFolder ? (
                        <FolderHome size={35} />
                      ) : (
                        <FolderIcons name={res.name} size={35} />
                      )}
                    </div>
                    <div className="homeRowText">{cleanName(res.name)}</div>
                  </div>
                  <div className="homeRowRight">{res.isFolder ? "→" : "↗"}</div>
                </Link>
              ))
            ) : (
              <p style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
                No encontramos nada con ese nombre. 😕
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
