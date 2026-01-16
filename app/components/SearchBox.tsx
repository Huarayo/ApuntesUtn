"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import treeRaw from "@/scripts/data/drive-tree.json";
import FolderIcons from "./icons/FolderIcons"
import Folder from "./icons/Folder";

// DEFINICIONES DE TIPOS (Para 0 errores)
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
  normName: string; // <--- Esto quita los errores de tus fotos
}

// FUNCIONES DE UTILIDAD
function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_-]+/g, " ").replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();
}

function cleanName(name: string) {
  return name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
      normName: norm(node.name) // <--- Aquí se crea la propiedad
    });

    if (node.children) {
      out = out.concat(buildFlatClient(node.children, nextPath));
    }
  }
  return out;
}

export default function SearchBox({ onSearch }: { onSearch: (r: SearchResult[] | null) => void }) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Cargamos el índice una sola vez
  const flatData = useMemo(() => buildFlatClient(treeRaw as Node[]), []);

  // Filtramos sugerencias al vuelo (0ms de latencia)
  const suggestions = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return [];
    const nq = norm(q);
    return flatData
      .filter(item => item.normName.includes(nq)) // <--- Ahora TS sabe que existe normName
      .sort((a, b) => {
        // Si uno es carpeta y el otro no, la carpeta va primero (-1)
        if (a.isFolder !== b.isFolder) {
          return a.isFolder ? -1 : 1;
        }
        // Si son del mismo tipo, ordenamos alfabéticamente
        return a.name.localeCompare(b.name, "es", { numeric: true });
      })
      .slice(0, 8);
      
  }, [query, flatData]);

  const handleOfficialSearch = () => {
    const q = query.trim();
    if (!q) {
      onSearch(null);
      return;
    }
    const nq = norm(q);
    const results = flatData.filter(item => item.normName.includes(nq));
    
    /* --- 2. ORDENAMOS ANTES DE ENVIAR --- */
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
        placeholder="Buscar materias..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
          if (e.target.value === "") onSearch(null);
        }}
        onKeyDown={(e) => e.key === "Enter" && handleOfficialSearch()}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />
      <button className="search-icon-btn" onClick={handleOfficialSearch}>🔍</button>

      {showDropdown && suggestions.length > 0 && (
        <div className="searchResultsBox searchResultsDropdown">
          {suggestions.map((res) => (
            <Link key={res.id || res.href} href={res.href} className="searchResultItem" onClick={() => setShowDropdown(false)}>
              <span>{res.isFolder ? <Folder /> : <FolderIcons name={res.name} size={25} />}</span>
              
              <div className="searchResultInfo">
                <span className="searchResultName">{cleanName(res.name)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// "use client";

// import { useEffect, useState } from "react";
// import Link from "next/link";
// import treeRaw from "@/scripts/data/drive-tree.json";
// import type { SearchResponse, SearchResult } from "@/app/lib/searchTypes";


// function cleanName(name: string) {
//   return name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");
// }

// export default function SearchBox({
//   onSearch,
// }: {
//   onSearch: (r: SearchResult[] | null) => void;
// }) {
//   const [query, setQuery] = useState("");
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [suggestions, setSuggestions] = useState<SearchResult[]>([]);

//   // helper tipado ✅
//   async function fetchSearch(q: string, limit: number, signal?: AbortSignal): Promise<SearchResult[]> {
//     const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=${limit}`, { signal });
//     if (!res.ok) return [];
//     const data: SearchResponse = await res.json();
//     return Array.isArray(data.results) ? data.results : [];
//   }

//   // ✅ debounce + abort
//   useEffect(() => {
//     const q = query.trim();
//     const controller = new AbortController();

//     const t = setTimeout(async () => {
//       try {
//         if (q.length < 2) {
//           setSuggestions((prev) => (prev.length ? [] : prev));
//           return;
//         }
//         const results = await fetchSearch(q, 6, controller.signal);
//         setSuggestions(results);
//       } catch (e: unknown) {
//         if (e instanceof DOMException && e.name === "AbortError") return;
//         setSuggestions([]);
//       }
//     }, 200);

//     return () => {
//       clearTimeout(t);
//       controller.abort();
//     };
//   }, [query]);

//   const handleOfficialSearch = async () => {
//     const q = query.trim();
//     if (!q) {
//       onSearch(null);
//       setShowDropdown(false);
//       return;
//     }

//     const results = await fetchSearch(q, 200);
//     onSearch(results);
//     setSuggestions(results.slice(0, 6)); // opcional
//     setShowDropdown(false);
//   };

//   return (
//     <div className="homeSearch">
//       <input
//         type="text"
//         className="homeInput"
//         placeholder="Buscar materias, unidades o TPs..."
//         value={query}
//         onChange={(e) => {
//           setQuery(e.target.value);
//           setShowDropdown(true);
//           if (e.target.value === "") onSearch(null);
//         }}
//         onKeyDown={(e) => e.key === "Enter" && handleOfficialSearch()}
//         onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
//       />

//       <button className="search-icon-btn" onClick={handleOfficialSearch} title="Buscar">
//         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//           <circle cx="11" cy="11" r="8" />
//           <path d="m21 21-4.3-4.3" />
//         </svg>
//       </button>

//       {showDropdown && suggestions.length > 0 && (
//         <div className="searchResultsBox searchResultsDropdown">
//           {suggestions.map((res) => (
//             <Link
//               key={res.id ?? res.href}
//               href={res.href}
//               className="searchResultItem"
//               target={res.isFolder ? "_self" : "_blank"}
//               rel={res.isFolder ? undefined : "noopener noreferrer"}
//               onClick={() => setShowDropdown(false)}
//             >
//               <span className="searchResultIcon">{res.isFolder ? "📁" : "📄"}</span>
//               <div className="searchResultInfo">
//                 <span className="searchResultName">{cleanName(res.name)}</span>
//                 <span className="searchResultMeta">{res.isFolder ? "Carpeta" : "Documento"}</span>
//               </div>
//             </Link>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
