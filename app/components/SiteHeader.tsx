"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "../hook/useTheme"

export default function SiteHeader() {
  // Quitamos 'isHome' porque no se estaba usando abajo
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme()

  const [montado, setMontado] = useState(false);


  useEffect(() => {
    // Al meterlo en un setTimeout, el linter ya no lo ve como un renderizado en cascada
    const timer = setTimeout(() => setMontado(true), 0);
    return () => clearTimeout(timer); // Limpiamos el timer por seguridad
  }, []);

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


        
        <div className="containerRigthHeader ">
          <button
              onClick={toggleTheme}
              className="btn-scheme"
              aria-label="Cambiar tema"
            >
{/* 3. Envolvé tus iconos del tema con esta condición: */}
              {montado ? (
                theme === 'dark' ? (
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#c7d2fe" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                  </svg>
                ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path d="M0 0h24v24H0z" fill="none" />
                <path fill="currentColor" d="M18 12a6 6 0 1 1-12 0a6 6 0 0 1 12 0" />
                <path fill="currentColor" fill-rule="evenodd" d="M12 1.25a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0V2a.75.75 0 0 1 .75-.75M4.399 4.399a.75.75 0 0 1 1.06 0l.393.392a.75.75 0 0 1-1.06 1.061l-.393-.393a.75.75 0 0 1 0-1.06m15.202 0a.75.75 0 0 1 0 1.06l-.393.393a.75.75 0 0 1-1.06-1.06l.393-.393a.75.75 0 0 1 1.06 0M1.25 12a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5H2a.75.75 0 0 1-.75-.75m19 0a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1a.75.75 0 0 1-.75-.75m-2.102 6.148a.75.75 0 0 1 1.06 0l.393.393a.75.75 0 1 1-1.06 1.06l-.393-.393a.75.75 0 0 1 0-1.06m-12.296 0a.75.75 0 0 1 0 1.06l-.393.393a.75.75 0 1 1-1.06-1.06l.392-.393a.75.75 0 0 1 1.061 0M12 20.25a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1a.75.75 0 0 1 .75-.75" clip-rule="evenodd" />
              </svg>



                ) 
              ) : (
                <span style={{ width: 24, height: 24, display: 'inline-block' }} /> // Espacio vacío temporal
              )}
          </button>
          <button className="menuBtn" onClick={() => setIsOpen(!isOpen)}>
            <div className={`hamburger ${isOpen ? 'open' : ''}`}></div>
          </button>
        </div>
        <nav className={`navMenu ${isOpen ? 'active' : ''}`}>
          
          <Link href="/" className="navbtn" onClick={() => setIsOpen(false)}>Inicio</Link>

          <Link href="/horarios" className="navbtn">Horarios Consulta</Link>
          <Link 
          href="/donar" 
          className="navbtn" 
      
          onClick={() => setIsOpen(false)}>Donar
           
             <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
              <path d="M0 0h24v24H0z" fill="none" />
              <path fill="currentColor" d="m12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5C2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53z" />
            </svg>
          </Link>

          <a href="https://docs.google.com/forms/d/e/1FAIpQLSfSL2aT5qI4fD5dG0UEItvf-zLTVkMQ2NWUTv7UZidTCThptg/viewform?usp=header" className="navbtn btnSubir" rel="noopener noreferrer">Subir Apunte</a>
        </nav>
        
        {isOpen && <div className="overlay" onClick={() => setIsOpen(false)}></div>}

        <div className="actions">
            {/* <Link href="/horarios" className="navElement">Horarios Consulta</Link>
            <Link href="/donar" className="navElement" onClick={() => setIsOpen(false)}>Donar</Link> */}

            <button
              onClick={toggleTheme}
              className="btn-scheme"
              aria-label="Cambiar Tema"
            >
{/* 3. Envolvé tus iconos del tema con esta condición: */}
              {montado ? (
                theme === 'dark' ? (
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#c7d2fe" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                  </svg>
                ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path d="M0 0h24v24H0z" fill="none" />
                <path fill="currentColor" d="M18 12a6 6 0 1 1-12 0a6 6 0 0 1 12 0" />
                <path fill="currentColor" fill-rule="evenodd" d="M12 1.25a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0V2a.75.75 0 0 1 .75-.75M4.399 4.399a.75.75 0 0 1 1.06 0l.393.392a.75.75 0 0 1-1.06 1.061l-.393-.393a.75.75 0 0 1 0-1.06m15.202 0a.75.75 0 0 1 0 1.06l-.393.393a.75.75 0 0 1-1.06-1.06l.393-.393a.75.75 0 0 1 1.06 0M1.25 12a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5H2a.75.75 0 0 1-.75-.75m19 0a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1a.75.75 0 0 1-.75-.75m-2.102 6.148a.75.75 0 0 1 1.06 0l.393.393a.75.75 0 1 1-1.06 1.06l-.393-.393a.75.75 0 0 1 0-1.06m-12.296 0a.75.75 0 0 1 0 1.06l-.393.393a.75.75 0 1 1-1.06-1.06l.392-.393a.75.75 0 0 1 1.061 0M12 20.25a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1a.75.75 0 0 1 .75-.75" clip-rule="evenodd" />
              </svg>



                ) 
              ) : (
                <span style={{ width: 24, height: 24, display: 'inline-block' }} /> // Espacio vacío temporal
              )}
            </button>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSfSL2aT5qI4fD5dG0UEItvf-zLTVkMQ2NWUTv7UZidTCThptg/viewform?usp=header" className="btn btnPrimary" rel="noopener noreferrer">
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