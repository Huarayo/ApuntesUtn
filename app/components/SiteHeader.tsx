"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="header container">
        {/* REEMPLAZO DEL TEXTO POR UN ÍCONO */}
        <Link href="/" className="logo-icon-link" aria-label="Volver al inicio">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="40" 
            height="40" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="header-logo-icon"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
        </Link>

        {/* BOTÓN HAMBURGUESA: Solo se ve en mobile */}
        <button className="menuBtn" onClick={() => setIsOpen(!isOpen)}>
          <div className={`hamburger ${isOpen ? 'open' : ''}`}></div>
        </button>

        {/* NAVEGACIÓN: Cambia de clase según el estado */}
        <nav className={`navMenu ${isOpen ? 'active' : ''}`}>
          <Link href="/" className="navbtn" onClick={() => setIsOpen(false)}>Inicio</Link>
          <Link href="/browse" className="navbtn" onClick={() => setIsOpen(false)}>Materias</Link>
          <Link href="/subir" className="navbtn btnSubir">Subir Apunte</Link>
        </nav>
        
        {/* OVERLAY: Fondo oscuro cuando el menú está abierto */}
        {isOpen && <div className="overlay" onClick={() => setIsOpen(false)}></div>}
        <div className="actions">
          <a 
            href="https://drive.google.com" 
            target="_blank" 
            className={isHome ? "btn" : "btn btnPrimary"}
            >
            Ir al Drive
          </a>
          
          {/* Solo aparece en el Home y con la clase de color verde */}
          {isHome && (
            <Link href="/subir" className="btn btnPrimary">
              Subí tu apunte
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}