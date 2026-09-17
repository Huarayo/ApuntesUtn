"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Horario } from "@/app/lib/horarios-types";

// Función para ignorar acentos y mayúsculas en el buscador
function normalizar(texto: string) {
  return (texto || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function HorariosPublicos() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estados de los filtros
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroDia, setFiltroDia] = useState("");
  const [filtroDocente, setFiltroDocente] = useState("");
  const [filtroMateria, setFiltroMateria] = useState("");

  useEffect(() => {
    fetch("/api/horarios")
      .then((res) => res.json())
      .then((data) => { 
        setHorarios(data.horarios || []); 
        setCargando(false); 
      })
      .catch(() => setCargando(false));
  }, []);

  // Opciones únicas para los selects
  const diasUnicos = Array.from(new Set(horarios.map(h => h.dia)));
  const docentesUnicos = Array.from(new Set(horarios.map(h => h.docente))).sort();
  const materiasUnicas = Array.from(new Set(horarios.map(h => h.materia))).sort();

  // Filtrado idéntico a tu función filtrar() original
  const filtrados = horarios.filter(h => {
    const q = normalizar(filtroTexto.trim());
    
    if (filtroDia && h.dia !== filtroDia) return false;
    if (filtroDocente && h.docente !== filtroDocente) return false;
    if (filtroMateria && h.materia !== filtroMateria) return false;
    
    if (q) {
      const textoFila = normalizar(`${h.docente} ${h.materia} ${h.aula} ${h.dia} ${h.horario}`);
      if (!textoFila.includes(q)) return false;
    }
    return true;
  });

  // Agrupado idéntico a tu función agruparPorDia() original
  const agrupadosPorDia = filtrados.reduce((acc, h) => {
    if (!acc[h.dia]) acc[h.dia] = [];
    acc[h.dia].push(h);
    return acc;
  }, {} as Record<string, Horario[]>);

  const limpiarFiltros = () => {
    setFiltroTexto("");
    setFiltroDia("");
    setFiltroDocente("");
    setFiltroMateria("");
  };

  return (
    <>

      <div className="hero">
        <div className="hero-eyebrow">Panel actualizado en tiempo real</div>
        <h1>¿Con quién te querés consultar hoy?</h1>
        <p>Buscá por docente, materia, día o aula. Todo se actualiza automáticamente apenas se sube un nuevo horario.</p>
      </div>

      <div className="controls">
        <div className="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            id="search-input" 
            placeholder="Buscar docente, materia o aula..." 
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
        </div>
        
        <select className="filter-select" value={filtroDia} onChange={(e) => setFiltroDia(e.target.value)}>
          <option value="">Todos los días</option>
          {diasUnicos.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        <select className="filter-select" value={filtroDocente} onChange={(e) => setFiltroDocente(e.target.value)}>
          <option value="">Todos los docentes</option>
          {docentesUnicos.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        
        <select className="filter-select" value={filtroMateria} onChange={(e) => setFiltroMateria(e.target.value)}>
          <option value="">Todas las materias</option>
          {materiasUnicas.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        
        <button className="btn-clear" id="btn-clear" onClick={limpiarFiltros}>
          Limpiar filtros
        </button>
      </div>

      <div className="board-wrap">
        <div className="result-count" id="result-count">
          <span>{filtrados.length}</span> horario{filtrados.length === 1 ? '' : 's'} encontrado{filtrados.length === 1 ? '' : 's'}
        </div>
        
        <div id="board-container">
          {cargando ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>Cargando horarios...</div>
          ) : filtrados.length === 0 ? (
            <div className="empty-state">
              <div className="big">∅</div>
              <p>No encontramos horarios con esos criterios. Probá con otra búsqueda o limpiá los filtros.</p>
            </div>
          ) : (
            Object.entries(agrupadosPorDia).map(([dia, lista]) => (
              <div className="day-group" key={dia}>
                <div className="day-label">{dia}</div>
                <div className="board-header-row">
                  <div>Hora</div><div>Docente</div><div>Materia</div><div>Aula</div>
                </div>
                
                {lista.map((h, i) => (
                  <div 
                    className="board-row" 
                    key={i} 
                    style={{ animationDelay: `${Math.min(i * 25, 300)}ms` }}
                  >
                    <div className="cell-time">{h.horario || '—'}</div>
                    <div className="cell-docente">{h.docente}</div>
                    <div className="cell-materia">{h.materia || '—'}</div>
                    <div className="cell-aula">{h.aula || '—'}</div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      <footer className="site-footer">HORARIOS DE CONSULTA · SISTEMA INTERNO</footer>
    </>
  );
}