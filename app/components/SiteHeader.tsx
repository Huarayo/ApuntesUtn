"use client";
import { useState } from "react";
import Link from "next/link";

export default function SiteHeader() {
  // Quitamos 'isHome' porque no se estaba usando abajo
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="header">
        <Link href="/" className="logo-icon-link" aria-label="Volver al inicio">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="40" height="40" viewBox="0 0 24 24" 
            fill="none" stroke="currentColor" strokeWidth="2" 
            strokeLinecap="round" strokeLinejoin="round"
            className="header-logo-icon"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
        </Link>

        <button className="menuBtn" onClick={() => setIsOpen(!isOpen)}>
          <div className={`hamburger ${isOpen ? 'open' : ''}`}></div>
        </button>

        <nav className={`navMenu ${isOpen ? 'active' : ''}`}>
          <Link href="/" className="navbtn" onClick={() => setIsOpen(false)}>Inicio</Link>
          <Link href="/browse" className="navbtn" onClick={() => setIsOpen(false)}>Materias</Link>
          <a href="https://docs.google.com/forms/..." className="navbtn btnSubir" rel="noopener noreferrer">Subir Apunte</a>
        </nav>
        
        {isOpen && <div className="overlay" onClick={() => setIsOpen(false)}></div>}

        <div className="actions">
            <a href="https://docs.google.com/forms/..." className="btn btnPrimary" rel="noopener noreferrer">
              Subí tu apunte
            </a>
        </div>
      </div>
    </header>
  );
}







// "use client";
// import { useState } from "react";
// import { usePathname } from "next/navigation";
// import Link from "next/link";

// export default function SiteHeader() {
//   const pathname = usePathname();
//   const isHome = pathname === "/";

//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <header className="topbar">
//       <div className="header">
//         {/* REEMPLAZO DEL TEXTO POR UN ÍCONO */}
//         <Link href="/" className="logo-icon-link" aria-label="Volver al inicio">
//           <svg 
//             xmlns="http://www.w3.org/2000/svg" 
//             width="40" 
//             height="40" 
//             viewBox="0 0 24 24" 
//             fill="none" 
//             stroke="currentColor" 
//             strokeWidth="2" 
//             strokeLinecap="round" 
//             strokeLinejoin="round"
//             className="header-logo-icon"
//           >
//             <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
//           </svg>
//         </Link>

//         {/* BOTÓN HAMBURGUESA: Solo se ve en mobile */}
//         <button className="menuBtn" onClick={() => setIsOpen(!isOpen)}>
//           <div className={`hamburger ${isOpen ? 'open' : ''}`}></div>
//         </button>

//         {/* NAVEGACIÓN: Cambia de clase según el estado */}
//         <nav className={`navMenu ${isOpen ? 'active' : ''}`}>
//           <Link href="/" className="navbtn" onClick={() => setIsOpen(false)}>Inicio</Link>
//           <Link href="/browse" className="navbtn" onClick={() => setIsOpen(false)}>Materias</Link>
//           <a href="https://docs.google.com/forms/d/e/1FAIpQLSfSL2aT5qI4fD5dG0UEItvf-zLTVkMQ2NWUTv7UZidTCThptg/viewform?usp=header" className="navbtn btnSubir" rel="noopener noreferrer">Subir Apunte</a>
//         </nav>
        
//         {/* OVERLAY: Fondo oscuro cuando el menú está abierto cosa del hamburger */}
//         {isOpen && <div className="overlay" onClick={() => setIsOpen(false)}></div>}


//         <div className="actions">
          
    
//             <a href="https://docs.google.com/forms/d/e/1FAIpQLSfSL2aT5qI4fD5dG0UEItvf-zLTVkMQ2NWUTv7UZidTCThptg/viewform?usp=header" className="btn btnPrimary" rel="noopener noreferrer">
//               Subí tu apunte
//             </a>
         
//         </div>
//       </div>
//     </header>
//   );
// }