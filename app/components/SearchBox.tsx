"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { SearchResponse, SearchResult } from "@/app/lib/searchTypes";


function cleanName(name: string) {
  return name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");
}

export default function SearchBox({
  onSearch,
}: {
  onSearch: (r: SearchResult[] | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);

  // helper tipado ✅
  async function fetchSearch(q: string, limit: number, signal?: AbortSignal): Promise<SearchResult[]> {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=${limit}`, { signal });
    if (!res.ok) return [];
    const data: SearchResponse = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  }

  // ✅ debounce + abort
  useEffect(() => {
    const q = query.trim();
    const controller = new AbortController();

    const t = setTimeout(async () => {
      try {
        if (q.length < 2) {
          setSuggestions((prev) => (prev.length ? [] : prev));
          return;
        }
        const results = await fetchSearch(q, 6, controller.signal);
        setSuggestions(results);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setSuggestions([]);
      }
    }, 200);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  const handleOfficialSearch = async () => {
    const q = query.trim();
    if (!q) {
      onSearch(null);
      setShowDropdown(false);
      return;
    }

    const results = await fetchSearch(q, 200);
    onSearch(results);
    setSuggestions(results.slice(0, 6)); // opcional
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
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />

      <button className="search-icon-btn" onClick={handleOfficialSearch} title="Buscar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>

      {showDropdown && suggestions.length > 0 && (
        <div className="searchResultsBox searchResultsDropdown">
          {suggestions.map((res) => (
            <Link
              key={res.id ?? res.href}
              href={res.href}
              className="searchResultItem"
              target={res.isFolder ? "_self" : "_blank"}
              rel={res.isFolder ? undefined : "noopener noreferrer"}
              onClick={() => setShowDropdown(false)}
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
