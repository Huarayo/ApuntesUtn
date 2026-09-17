"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TreeNode } from "@/app/components/TreeLoader";


type PackBannerProps = {
  activePack: { title: string; files: TreeNode[] } | null;
  onClose: () => void;
};

export default function PackBanner({ activePack, onClose }: PackBannerProps) {
  // El key en AnimatedList asegura que empiece en 0 sin necesidad de useEffect
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotation, setRotation] = useState(0);

  const rotateDoc = () => setRotation((prev) => (prev + 90) % 360);

  const downloadAllPackFiles = (files: TreeNode[]) => {
    files.forEach((file, index) => {
      setTimeout(() => {
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", file.name);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 450); 
    });
  };

  const nextPart = () => {
    if (activePack) setCurrentIndex((prev) => (prev + 1) % activePack.files.length);
    setRotation(0);
  };

  const prevPart = () => {
    if (activePack) setCurrentIndex((prev) => (prev - 1 + activePack.files.length) % activePack.files.length);
    setRotation(0);
};

  if (!activePack || activePack.files.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fullscreen-pack-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="fullscreen-pack-container"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()} 
        >
          {/* ENCABEZADO */}
          <div className="fullscreen-pack-header">
            <div className="pack-header-info">
              <span className="pack-badge-pill">
                PARTE {currentIndex + 1} DE {activePack.files.length}
              </span>
              <h2 title={activePack.files[currentIndex].name}>
                {activePack.files[currentIndex].name}
              </h2>
            </div>
            
            <div className="pack-header-actions">
              <button className="btn-rotate" onClick={rotateDoc} title="Rotar documento">
                🔄
              </button>
              <button 
                className="btn-fullscreen-download-all"
                onClick={() => downloadAllPackFiles(activePack.files)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 8 }}>
                  <path d="m12 16l-5-5l1.4-1.45l2.6 2.6V4h2v8.15l2.6-2.6L17 11zm-6 4q-.825 0-1.412-.587T4 18v-3h2v3h12v-3h2v3q0 .825-.587 1.413T18 20z"/>
                </svg>
                Descargar
              </button>

              <button className="btn-fullscreen-close" onClick={onClose}>✕</button>
            </div>
          </div>

          {/* CUERPO DEL VISOR DIRECTO */}
          <div className="pack-viewer-body">
            <button className="pack-nav-arrow prev-arrow" onClick={prevPart} title="Parte Anterior">
              ◀
            </button>

            <div className="pack-iframe-wrapper">
              <iframe
                src={`https://drive.google.com/file/d/${activePack.files[currentIndex].id}/preview`}
                width="100%"
                height="100%"
                style={{
                    border: "none",
                    width: "100%",
                    height: "100%",
                    transform: `rotate(${rotation}deg)`,
                    transition: "transform 0.3s ease",
                }}
                allow="autoplay"
            />
            </div>

            <button className="pack-nav-arrow next-arrow" onClick={nextPart} title="Parte Siguiente">
              ▶
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}