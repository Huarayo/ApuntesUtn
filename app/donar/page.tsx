"use client";

export default function Donar() {
  return (
    <div className="donar-page">
      <div className="hero">
        <div className="donarEyebrow">Apoyar el proyecto</div>
        <div className="donar-title">
            <h1>Invitame un café </h1>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
              <line x1="6" y1="2" x2="6" y2="4" />
              <line x1="10" y1="2" x2="10" y2="4" />
              <line x1="14" y1="2" x2="14" y2="4" />
            </svg>
        </div>
      
        <p>
          Si la página te resultó útil y querés apoyar el proyecto, podés hacer una donación. Tu aporte ayuda a que la plataforma siga funcionando y mejorando todos los días.
        </p>
        
        <div className="donar-content">
          <div className="donar-grid">
            <a href="https://mpago.la/1o6QtcV" target="_blank" rel="noopener noreferrer" className="btn-donar btnPrimaryDonation">
              $ 100
            </a>
            <a href="https://mpago.la/1AQSseP" target="_blank" rel="noopener noreferrer" className="btn-donar btnPrimaryDonation">
              $ 500
            </a>
            <a href="https://mpago.la/1hLSKTW" target="_blank" rel="noopener noreferrer" className="btn-donar btnPrimaryDonation col-span-2">
              $ 1.000
            </a>
          </div>

          <div className="donar-libre-container">
            <a href="https://link.mercadopago.com.ar/apuntesutn" target="_blank" rel="noopener noreferrer" className="btn donarGhost btn-block">
              Monto a elección
            </a>
          </div>


        </div>
      </div>
      
      <footer className="site-footer">APUNTES UTN · GRACIAS POR TU APOYO</footer>
    </div>
  );
}