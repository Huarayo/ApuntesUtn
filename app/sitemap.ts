
import { MetadataRoute } from "next";
// Importá tus funciones del árbol (ajustá la ruta si es necesario)
import { getTree, isFolder, slugify, type Node } from "@/app/lib/utils";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.apuntesutn.com/";

export default function sitemap(): MetadataRoute.Sitemap {
  const tree = getTree();
  const now = new Date();

  // 1. Empezamos con las rutas básicas
  const routes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, priority: 1 },
    { url: `${siteUrl}/browse`, lastModified: now, priority: 0.9 },
  ];

  // 2. Usamos el "Caminante" (walk) para agregar las 253 carpetas automáticamente

function walk(nodes: Node[], currentPath: string, depth: number) {
    if (depth > 4 || !nodes) return;

    for (const node of nodes) {
      if (isFolder(node)) {
        const segment = `${slugify(node.name)}--${node.id}`;
        const fullPath = currentPath ? `${currentPath}/${segment}` : segment;
        const fullUrl = `${siteUrl}/browse/${fullPath}`;

        routes.push({
          url: fullUrl,
          lastModified: now,
          priority: Number((Math.max(0.4, 0.8 - depth * 0.1)).toFixed(2)),
        });

        if (node.children) {
          walk(node.children, fullPath, depth + 1);
        }
      }
    }
  }

  walk(tree, "", 1);

  return routes;
}