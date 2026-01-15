import treeRaw from "@/scripts/data/drive-tree.json";

export type Node = {
  id?: string;
  name: string;
  type: string;
  url?: string;
  children?: Node[];
};

const tree = treeRaw as Node[];

const byId = new Map<string, Node>();
const childrenIdsByParentId = new Map<string, Set<string>>();

// root = hijos directos del json
const ROOT = "__root__";

function isFolderType(t: string) {
  return t === "folder" || t === "application/vnd.google-apps.folder";
}

function buildIndex(nodes: Node[], parentId: string) {
  // guardar ids de los hijos de este parent
  const set = new Set<string>();
  for (const n of nodes) {
    if (n.id) set.add(n.id);
  }
  childrenIdsByParentId.set(parentId, set);

  for (const n of nodes) {
    if (n.id) byId.set(n.id, n);
    if (n.children) buildIndex(n.children, n.id ?? "");
  }
}

// se ejecuta 1 vez
if (byId.size === 0) {
  buildIndex(tree, ROOT);
}

export function isFolder(n: Node) {
  return isFolderType(n.type);
}

export function getNodeById(id: string) {
  return byId.get(id);
}

export function getRootChildren(): Node[] {
  return tree;
}

// ✅ valida que id sea hijo directo del parent (ruta real)
export function isChildOf(parentId: string, childId: string) {
  const set = childrenIdsByParentId.get(parentId);
  return set ? set.has(childId) : false;
}

export function getRootId() {
  return ROOT;
}
