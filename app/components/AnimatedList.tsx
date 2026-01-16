"use client";
import { motion, Variants } from "framer-motion";
import Link from "next/link"; // Importante para la velocidad
 
import FolderIcons from "./icons/FolderIcons";
import Folder from "./icons/Folder";

interface Node {
  id?: string;
  name: string;
  type: string;
  url?: string;
}

interface AnimatedListProps {
  childrenData: Node[];
  segs: string[];
}

// Helpers locales
const cleanName = (name: string) => name.replace(/_/g, " ").replace(/^\d+[._\s]+/, "");
const isFolder = (n: Node) => n.type === "folder" || n.type === "application/vnd.google-apps.folder";
const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const segOfFolder = (n: Node) => `${slugify(n.name)}--${n.id}`;

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
    transition: { type: "spring", stiffness: 100 } 
  },
};

export default function AnimatedList({ childrenData, segs }: AnimatedListProps) {
  return (
    <motion.div 
      className="miniList"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {childrenData.map((item: Node) => {
        const folder = isFolder(item);
        const href = folder
          ? `/browse/${[...segs, segOfFolder(item)].map(encodeURIComponent).join("/")}`
          : (item.url ?? "#");

        // Creamos el componente de animación por separado para que el código sea legible
        return (
          <motion.div key={item.id ?? item.name} variants={itemAnim}>
            {folder ? (
              /* NAVEGACIÓN INTERNA: Instantánea gracias a Link */
              <Link href={href} className="miniRow">
                <RowContent item={item} folder={true} />
              </Link>
            ) : (
              /* ENLACE EXTERNO: Abre en pestaña nueva */
              <a href={href} className="miniRow" target="_blank" rel="noopener noreferrer">
                <RowContent item={item} folder={false} />
              </a>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// Sub-componente para no repetir el HTML de adentro
function RowContent({ item, folder }: { item: Node, folder: boolean }) {
  return (
    <>
      <div className="miniRowLeft">
        <span className={`iconIcon ${folder ? "folder" : "file"}`}>
          {folder ? <Folder size={35} /> : <FolderIcons name={item.name} size={45} />}
        </span>
        <span className="miniName">{cleanName(item.name)}</span>
      </div>
      <span className="miniRight">{folder ? "›" : "↗"}</span>
    </>
  );
}