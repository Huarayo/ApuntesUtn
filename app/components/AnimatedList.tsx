"use client";

import { motion, Variants } from "framer-motion";
import FolderIcons from "./icons/FolderIcons";
import Folder from "./icons/Folder";
import type { TreeNode } from "@/app/components/TreeLoader";

type Props = {
  childrenData: TreeNode[];
  onFolderClick: (n: TreeNode) => void;
  onFileClick: (id: string) => void;
};

const isFolder = (n: TreeNode) =>
  n.type === "folder" || n.type === "application/vnd.google-apps.folder";

const cleanName = (name: string) =>
  name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemAnim: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100 },
  },
};

export default function AnimatedList({ childrenData, onFolderClick, onFileClick }: Props) {
  return (
    <motion.div   key={childrenData.map(x => x.id ?? x.name).join("|")}
  className="miniList"
  variants={container}
  initial="hidden"
  animate="show">
      {childrenData.map((item) => {
        const folder = isFolder(item);
        
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${item.id}`;

        return (
          <motion.div key={item.id ?? item.name} variants={itemAnim}>
            {folder ? (
              // ✅ CARPETA: botón offline (no Next Link)
              <button className="miniRow" onClick={() => onFolderClick(item)}>
                <RowContent item={item} folder />
              </button>
            ) : (
              <div className="miniRow"
               onClick={() => onFileClick(item.id!)} 
               title="Previsualizar apunte">
                {/* ACCIÓN PRINCIPAL: Abre el visor (Modal) en tu web */}
  
                <RowContent item={item} folder={false} />

                {/* ACCIONES SECUNDARIAS: Descarga y Link Externo */}
                <div className="miniRowRight">
                  <a 
                  href={downloadUrl} 
                  className="btn-icon"
                  title="Descargar PDF"
                    onClick={(e)=> e.stopPropagation()}
                  
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="m12 16l-5-5l1.4-1.45l2.6 2.6V4h2v8.15l2.6-2.6L17 11zm-6 4q-.825 0-1.412-.587T4 18v-3h2v3h12v-3h2v3q0 .825-.587 1.413T18 20z"/></svg>
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
                </div>
              </div>
            )}
          </motion.div>
  
        );
      })}
    </motion.div>
  );
}

function RowContent({ item, folder }: { item: TreeNode; folder: boolean }) {
  return (
    <>
      <div className="miniRowLeft">
        <span className={`iconIcon ${folder ? "folder" : "file"}`}>
          {folder ? <Folder size={35} /> : <FolderIcons name={item.name} size={45} />}
        </span>
        <span className="miniName">{cleanName(item.name)}</span>
      </div>
 
    </>
  );
}


// "use client";
// import { motion, Variants } from "framer-motion";
// import Link from "next/link"; // Importante para la velocidad
 
// import FolderIcons from "./icons/FolderIcons";
// import Folder from "./icons/Folder";

// interface Node {
//   id?: string;
//   name: string;
//   type: string;
//   url?: string;
// }

// interface AnimatedListProps {
//   childrenData: Node[];
//   segs: string[];
// }

// // Helpers locales
// const cleanName = (name: string) => name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");
// const isFolder = (n: Node) => n.type === "folder" || n.type === "application/vnd.google-apps.folder";
// const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
// const segOfFolder = (n: Node) => `${slugify(n.name)}--${n.id}`;

// const container: Variants = {
//   hidden: { opacity: 0 },
//   show: {
//     opacity: 1,
//     transition: { staggerChildren: 0.05, delayChildren: 0.1 },
//   },
// };

// const itemAnim: Variants = {
//   hidden: { opacity: 0, y: 15 },
//   show: { 
//     opacity: 1, 
//     y: 0, 
//     transition: { type: "spring", stiffness: 100 } 
//   },
// };

// export default function AnimatedList({ childrenData, segs }: AnimatedListProps) {
//   return (
//     <motion.div 
//       className="miniList"
//       variants={container}
//       initial="hidden"
//       animate="show"
//     >
//       {childrenData.map((item: Node) => {
//         const folder = isFolder(item);
//         const href = folder
//           ? `/browse/${[...segs, segOfFolder(item)].map(encodeURIComponent).join("/")}`
//           : (item.url ?? "#");

//         // Creamos el componente de animación por separado para que el código sea legible
//         return (
//           <motion.div key={item.id ?? item.name} variants={itemAnim}>
//             {folder ? (
//               /* NAVEGACIÓN INTERNA: Instantánea gracias a Link */
//               <Link href={href} className="miniRow">
//                 <RowContent item={item} folder={true} />
//               </Link>
//             ) : (
//               /* ENLACE EXTERNO: Abre en pestaña nueva */
//               <a href={href} className="miniRow" target="_blank" rel="noopener noreferrer">
//                 <RowContent item={item} folder={false} />
//               </a>
//             )}
//           </motion.div>
//         );
//       })}
//     </motion.div>
//   );
// }

// // Sub-componente para no repetir el HTML de adentro
// function RowContent({ item, folder }: { item: Node, folder: boolean }) {
//   return (
//     <>
//       <div className="miniRowLeft">
//         <span className={`iconIcon ${folder ? "folder" : "file"}`}>
//           {folder ? <Folder size={35} /> : <FolderIcons name={item.name} size={45} />}
//         </span>
//         <span className="miniName">{cleanName(item.name)}</span>
//       </div>
//       <span className="miniRight">{folder ? "›" : "↗"}</span>
//     </>
//   );
// }