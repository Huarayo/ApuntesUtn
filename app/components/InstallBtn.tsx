"use client";
import { useEffect, useState } from "react";

// 1. Definimos la interfaz del evento para evitar el 'any'
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallBtn() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Escuchamos el evento de instalación
    const handler = (e: Event) => {
      // Evitamos que el navegador muestre su propio cartel feo
      e.preventDefault();
      // Guardamos el evento para usarlo cuando el usuario toque nuestro botón
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Limpiamos el evento al desmontar el componente para evitar fugas de memoria
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostramos el prompt de instalación
    await deferredPrompt.prompt();
    
    // Esperamos la respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      // Si aceptó, limpiamos el prompt para que desaparezca el botón
      setDeferredPrompt(null);
    }
  };

  // Si no hay prompt guardado (porque ya está instalada o el navegador no lo soporta), no mostramos nada
  if (!deferredPrompt) return null;

  return (
    <div className="install-banner">
      <div className="install-text">
        <p>✨ <b>¡Instalá la App!</b></p>
        <p>Accedé más rápido a tus apuntes.</p>
      </div>
      <button onClick={handleInstallClick} className="btn-install">
        Instalar
      </button>
    </div>
  );
}