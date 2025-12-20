"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import treeRaw from "@/scripts/data/drive-tree.json";

// Utilidad para limpiar nombres de archivos y carpetas
function cleanName(name: string) {
  return name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");
}

// Generador de slugs para rutas de carpetas
function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface SearchBoxProps {
  onSearch: (results: any[] | null) => void;
}

export default function SearchBox({ onSearch }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // 1. Aplanamos el árbol JSON para buscar en todo el contenido
  const flatList = useMemo(() => {
    const results: any[] = [];
    const flatten = (nodes: any[], path: string[] = []) => {
      nodes.forEach(node => {
        const isF = node.type === "folder" || node.type === "application/vnd.google-apps.folder";
        const segment = `${slugify(node.name)}--${node.id}`;
        const currentPath = [...path, segment];
        
        results.push({
          ...node,
          href: isF ? "/browse/" + currentPath.map(encodeURIComponent).join("/") : node.url,
          isFolder: isF
        });
        
        if (node.children) flatten(node.children, currentPath);
      });
    };
    flatten(treeRaw as any[]);
    return results;
  }, []);

  // 2. Sugerencias rápidas para el Dropdown (Top 6)
  const suggestions = useMemo(() => {
    if (query.length < 2) return [];
    return flatList
      .filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6);
  }, [query, flatList]);

  // 3. Acción de búsqueda oficial (Enter o Click Lupa)
  const handleOfficialSearch = () => {
    if (query.length === 0) {
      onSearch(null); // Resetea a la vista de materias
    } else {
      const filtered = flatList.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
      );
      onSearch(filtered);
    }
    setShowDropdown(false);
  };

  return (
    <div className="homeSearch">
      <input 
        type="text"
        className="homeInput" 
        placeholder="Buscar materias, unidades o TPs..." 
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
          if (e.target.value === "") onSearch(null);
        }}
        onKeyDown={(e) => e.key === "Enter" && handleOfficialSearch()}
        // Delay para permitir que el clic en el dropdown funcione antes de cerrarse
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)} 
      />
      
      {/* Botón Lupa integrado y funcional */}
      <button className="search-icon-btn" onClick={handleOfficialSearch} title="Buscar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
      </button>

      {/* DROPDOWN DE RESULTADOS RÁPIDOS */}
      {showDropdown && suggestions.length > 0 && (
        <div className="searchResultsDropdown">
          {suggestions.map((res, i) => (
            <Link 
              key={i} 
              href={res.href || "#"} 
              className="searchResultItem"
              target={res.isFolder ? "_self" : "_blank"}
            >
              <span className="searchResultIcon">{res.isFolder ? "📁" : "📄"}</span>
              <div className="searchResultInfo">
                <span className="searchResultName">{cleanName(res.name)}</span>
                <span className="searchResultMeta">{res.isFolder ? "Carpeta" : "Documento"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}