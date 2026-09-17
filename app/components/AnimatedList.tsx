"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import FolderIcons from "./icons/FolderIcons";
import Folder from "./icons/Folder";
import type { TreeNode } from "@/app/components/TreeLoader";
import PackBanner from "./PackBanner";

type Props = {
  childrenData: TreeNode[];
  onFolderClick: (n: TreeNode) => void;
  onFileClick: (id: string) => void;
};

const isFolder = (n: TreeNode) =>
  n.type === "folder" || n.type === "application/vnd.google-apps.folder";

// Helper para limpiar el nombre y detectar el Pack
const getBaseName = (name: string) => {
  const match = name.match(/(.*?)\[PARTE\s*\d+\]/i);
  return match ? match[1].trim() : name;
};

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemAnim: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
};

export default function AnimatedList({ childrenData, onFolderClick, onFileClick }: Props) {
  // Estado para abrir el visor exclusivo de Packs
  const [activePack, setActivePack] = useState<{ title: string; files: TreeNode[] } | null>(null);

  const displayItems: TreeNode[] = [];
  const groups: { [key: string]: TreeNode[] } = {};

  childrenData.forEach((item) => {
    if (isFolder(item)) {
      displayItems.push(item);
    } else {
      const baseName = getBaseName(item.name);
      if (!groups[baseName]) {
        groups[baseName] = [];
        displayItems.push(item); // 💡 Agrega solo la Parte 1 a la lista
      }
      groups[baseName].push(item);
    }
  });

  return (
    <>
      <motion.div   
        key={displayItems.map(x => x.id ?? x.name).join("|")}
        className="miniList"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {displayItems.map((item) => {
          const folder = isFolder(item);
          const baseName = getBaseName(item.name);
          const groupFiles = groups[baseName] || [];
          const hasContinuations = groupFiles.length > 1;

          const downloadUrl = `https://drive.google.com/uc?export=download&id=${item.id}`;

          return (
            <motion.div key={item.id ?? item.name} variants={itemAnim}>
              {folder ? (
                <button className="miniRow" onClick={() => onFolderClick(item)}>
                  <RowContent item={item} folder />
                </button>
              ) : (
                <div 
                  className="miniRow"
                  onClick={() => {
                    // Si hacen click en la fila, abre tu visor normal (Parte 1)
                    onFileClick(item.id!);
                  }} 
                >
                  <RowContent item={item} folder={false} isSuperFile={hasContinuations} />

                  <div className="miniRowRight">
                    {hasContinuations ? (
                      /* 📦 Abre el visor especial del Pack */
                      <button
                        className="btn-special-group"
                        title="Ver Pack Completo"
                        onClick={(e) => {
                          e.stopPropagation(); 
                          setActivePack({ title: baseName, files: groupFiles });
                        }}
                      >
                        <span className="badge-parts">📦 Ver Pack ({groupFiles.length})</span>
                      </button>
                    ) : (
                      <>
                      <a 
                        href={downloadUrl} 
                        className="btn-icon"
                        title="Descargar PDF"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                          <path fill="currentColor" d="m12 16l-5-5l1.4-1.45l2.6 2.6V4h2v8.15l2.6-2.6L17 11zm-6 4q-.825 0-1.412-.587T4 18v-3h2v3h12v-3h2v3q0 .825-.587 1.413T18 20z"/>
                        </svg>
                      </a>
                      <a 
                        href={item.url ?? "#"} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-icon" 
                        title="Ver en Google Drive"
                        onClick = {(e) => e.stopPropagation()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M11 17H7q-2.075 0-3.537-1.463T2 12t1.463-3.537T7 7h4v2H7q-1.25 0-2.125.875T4 12t.875 2.125T7 15h4zm-3-4v-2h8v2zm5 4v-2h4q1.25 0 2.125-.875T20 12t-.875-2.125T17 9h-4V7h4q2.075 0 3.538 1.463T22 12t-1.463 3.538T17 17z"/></svg>
                      </a> 
                    </> 
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* 📦 Visor directo del Pack */}
      <PackBanner 
        key={activePack ? activePack.title : "none"}
        activePack={activePack}
        onClose={() => setActivePack(null)}
      />
    </>
  );
}

function RowContent({ item, folder, isSuperFile }: { item: TreeNode; folder: boolean; isSuperFile?: boolean }) {
  return (
    <div className="miniRowLeft">
      <span className={`iconIcon ${folder ? "folder" : "file"} ${isSuperFile ? "super-file-icon-pack" : ""}`}>
        {folder ? <Folder size={35} /> : <FolderIcons name={item.name} size={45} />}
      </span>
      <span className="miniName">
        {item.name} {isSuperFile && <span className="super-tag-pack">📦 Pack</span>}
      </span>
    </div>
  );
}