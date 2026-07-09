"use client";
import { useState, useMemo, useEffect } from "react";
import FolderIcons from "./icons/FolderIcons";
import Folder from "./icons/Folder";
import Link from "next/link";

// Leer vercel blob
const BLOB_URL = "https://dhfonqeb4oz4dngj.public.blob.vercel-storage.com";
const TREE_PATH = "drive-tree-v3.json";

// DEFINICIONES DE TIPOS
interface Node {
  id?: string;
  name: string;
  type: string;
  url?: string;
  children?: Node[];
}

interface SearchResult {
  id?: string;
  name: string;
  href: string;
  isFolder: boolean;
  normName: string;
}

// FUNCIONES DE UTILIDAD
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

function buildFlatClient(nodes: Node[], path: string[] = []): SearchResult[] {
  let out: SearchResult[] = [];
  for (const node of nodes) {
    const isFolder = node.type === "folder" || node.type === "application/vnd.google-apps.folder";
    const seg = isFolder ? `${slugify(node.name)}--${node.id}` : "";
    const nextPath = isFolder ? [...path, seg] : path;

    out.push({
      id: node.id,
      name: node.name,
      isFolder,
      href: isFolder
        ? "/browse/" + nextPath.map(encodeURIComponent).join("/")
        : (node.url ?? "#"),
      normName: norm(node.name)
    });

    if (node.children) {
      out = out.concat(buildFlatClient(node.children, nextPath));
    }
  }
  return out;
}

// Cache para no cargar 2 veces
let cachedTree: Node[] | null = null;
let cachedPromise: Promise<Node[]> | null = null;

async function loadTree(): Promise<Node[]> {
  if (cachedTree) return cachedTree;

  if (!cachedPromise) {
    const url = `${BLOB_URL}/${TREE_PATH}?t=${Date.now()}`;
    cachedPromise = fetch(url, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar el árbol");
        return r.json();
      })
      .then((data: Node[]) => {
        cachedTree = data;
        return data;
      })
      .catch((err) => {
        cachedPromise = null;
        throw err;
      });
  }

  return cachedPromise;
}

export default function SearchBox({ 
  onSearch
}: { 
  onSearch: (r: SearchResult[] | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [flatData, setFlatData] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTree()
      .then((tree) => {
        const flat = buildFlatClient(tree as Node[]);
        setFlatData(flat);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando el árbol para la búsqueda:", err);
        setLoading(false);
      });
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim();
    if (q.length < 2 || loading) return [];
    const nq = norm(q);
    return flatData
      .filter((item) => item.normName.includes(nq))
      .sort((a, b) => {
        if (a.isFolder !== b.isFolder) {
          return a.isFolder ? -1 : 1;
        }
        return a.name.localeCompare(b.name, "es", { numeric: true });
      })
      .slice(0, 8);
  }, [query, flatData, loading]);

  const handleOfficialSearch = () => {
    const q = query.trim();
    if (!q) {
      onSearch(null);
      return;
    }
    const nq = norm(q);
    const results = flatData.filter((item) => item.normName.includes(nq));

    results.sort((a, b) => {
      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? -1 : 1;
      }
      return a.name.localeCompare(b.name, "es", { numeric: true });
    });

    onSearch(results);
    setShowDropdown(false);
  };

  return (
    <div className="homeSearch">
      <input
        type="text"
        className="homeInput"
        placeholder={loading ? "Cargando..." : "Buscar materias..."}
        value={query}
        disabled={loading}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
          if (e.target.value === "") onSearch(null);
        }}
        onKeyDown={(e) => e.key === "Enter" && handleOfficialSearch()}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />

      <button className="search-icon-btn" onClick={handleOfficialSearch}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="m19.6 21l-6.3-6.3q-.75.6-1.725.95T9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l6.3 6.3zM9.5 14q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14"
          />
        </svg>
      </button>

      {showDropdown && suggestions.length > 0 && (
        <div className="searchResultsBox searchResultsDropdown">
          {suggestions.map((res, index) => {
            const isFolder = res.isFolder;
            
            return isFolder ? (
              // ✅ CARPETA: misma pestaña
              <Link
                key={`${res.id || res.href}-${index}`}
                href={res.href}
                className="searchResultItem"
                onClick={() => {
                  setShowDropdown(false);
                  setQuery(res.name);
                }}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  textDecoration: "none",
                  color: "inherit",
                  width: "100%"
                }}
              >
                <span><Folder /></span>
                <div className="searchResultInfo">
                  <span className="searchResultName">{cleanName(res.name)}</span>
                </div>
              </Link>
            ) : (
            <Link
            key={`${res.id || res.href}-${index}`}
            href={res.href}
            target="_blank"
            rel="noopener noreferrer"
            className="searchResultItem"
            onClick={() => {
              setShowDropdown(false);
              setQuery(res.name);
            }}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 12px",
              textDecoration: "none",
              color: "inherit",
              width: "100%"
            }}
          >
            <span><FolderIcons name={res.name} size={25} /></span>
            <div className="searchResultInfo">
              <span className="searchResultName">{cleanName(res.name)}</span>
            </div>
          </Link>

            );
          })}
        </div>
      )}
    </div>
  );
}