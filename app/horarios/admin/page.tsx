"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminHorarios() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [estado, setEstado] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [mensaje, setMensaje] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  // Para las tarjetas de estadísticas
  const [stats, setStats] = useState({ total: 0, ultimaCarga: "—", fecha: "" });

  useEffect(() => {
    fetch("/api/horarios")
      .then(res => res.json())
      .then(data => {
        if (data.horarios) {
          const ultima = data.historialCargas?.[0];
          setStats({
            total: data.horarios.length,
            ultimaCarga: ultima ? ultima.filasImportadas : "—",
            fecha: ultima ? ultima.fecha : ""
          });
        }
      });
  }, [estado]); // Se actualiza cuando subís un nuevo Excel

  const handleSubir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo) return;
    setEstado("loading");
    
    const formData = new FormData(); 
    formData.append("archivo_excel", archivo);
    
    try {
      const res = await fetch("/api/horarios/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEstado("success"); 
      setMensaje(`Última carga: ${archivo.name}`);
    } catch (err: unknown) { 
      setEstado("error"); 
      setMensaje(err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <h1>Panel de administración</h1>
        <Link href="/horarios" className="logout-link">Volver al tablero</Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Horarios cargados actualmente</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.ultimaCarga}</div>
          <div className="stat-label">Filas en la última carga</div>
        </div>
      </div>

      <div className="upload-card">
        <h2>Subir nuevo Excel de horarios</h2>
        <p className="sub">El nuevo archivo reemplaza por completo los horarios actuales. Columnas necesarias:</p>
        <div className="expected-cols">
          <span className="col-chip">DIA</span>
          <span className="col-chip">HORARIO</span>
          <span className="col-chip">DOCENTE</span>
          <span className="col-chip">MATERIA</span>
          <span className="col-chip">AULA</span>
        </div>

        <form onSubmit={handleSubir} id="upload-form">
          <div 
            className={`dropzone ${isDragging ? 'drag-over' : ''}`} 
            id="dropzone"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault(); setIsDragging(false);
              if (e.dataTransfer.files?.length > 0) setArchivo(e.dataTransfer.files[0]);
            }}
          >
            <input 
              type="file" name="archivo_excel" id="file-input" accept=".xlsx,.xls" required 
              onChange={(e) => setArchivo(e.target.files?.[0] || null)}
            />
            <div className="icon">📊</div>
            <div className="main-text">Arrastrá tu Excel acá o hacé clic para elegirlo</div>
            <div className="sub-text">Formatos aceptados: .xlsx, .xls (máx. 10 MB)</div>
            <div className="filename" id="filename-display" style={{ display: archivo ? 'block' : 'none' }}>
              {archivo ? `Seleccionado: ${archivo.name}` : ''}
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '18px' }}>Actualizar horarios</button>
        </form>

        {mensaje && (
          <div className="last-update">
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
}