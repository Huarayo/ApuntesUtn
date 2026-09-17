"use client";
import { useState, useEffect } from "react";

interface Node {
  id: string; 
  name: string;
  type: string;
  url?: string;
  children?: Node[];
  source?: string;
}

interface IncomingNode {
  id?: string;
  name: string;
  type: string;
  url?: string;
  children?: IncomingNode[];
  source?: string;
}

const mapearYAsignarIds = (nodes: IncomingNode[]): Node[] => {
  return nodes.map((node, index) => ({
    ...node,
    id: node.id || `${node.type}-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
    children: node.children ? mapearYAsignarIds(node.children) : undefined,
  }));
};

// Mover el filtro aquí para ejecutarlo UNA SOLA VEZ cuando el JSON llega de la API
const filterDriveNodes = (nodes: Node[]): Node[] => {
  const result: Node[] = [];
  for (const node of nodes) {
    if (node.type === "folder") {
      const filteredChildren = node.children ? filterDriveNodes(node.children) : [];
      result.push({ ...node, children: filteredChildren });
    } else if (node.source !== "drive") {
      result.push(node);
    }
  }
  return result;
};

export default function AdminPanel() {
  // Guardamos directamente el árbol filtrado y listo para ser editado
  const [tree, setTree] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/tree")
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar");
        return r.json();
      })
      .then((data) => {
        const conIds = mapearYAsignarIds(data);
        // 🔥 FILTRAMOS AQUÍ: El estado 'tree' ahora contiene única y exclusivamente lo editable
        const limpio = filterDriveNodes(conIds);
        setTree(limpio);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const saveTree = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Guardamos el 'tree' actual que ya tiene todas las modificaciones directas
        body: JSON.stringify({ tree: tree }), 
      });
      if (!res.ok) throw new Error("Error al guardar en el servidor");
      
      alert("✅ ¡JSON modificado y guardado con éxito!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error desconocido");
      }
    }
    setIsSaving(false);
  };

  const addFolder = (parentId?: string) => {
    const name = prompt("Nombre de la carpeta:");
    if (!name) return;

    const newFolder: Node = {
      id: `folder-${Date.now()}`,
      name,
      type: "folder",
      children: [],
    };

    if (!parentId) {
      setTree([...tree, newFolder]);
    } else {
      const addToParent = (nodes: Node[]): Node[] => {
        return nodes.map((node) => {
          if (node.id === parentId) {
            return {
              ...node,
              children: [...(node.children || []), newFolder],
            };
          }
          if (node.children) {
            return { ...node, children: addToParent(node.children) };
          }
          return node;
        });
      };
      setTree(addToParent(tree));
    }
  };

  const addFile = (parentId?: string) => {
    const name = prompt("Nombre del archivo:");
    if (!name) return;
    const url = prompt("Link de Google Drive:");
    if (!url) return;

    const newFile: Node = {
      id: `file-${Date.now()}`,
      name,
      type: "file",
      url,
    };

    if (!parentId) {
      setTree([...tree, newFile]);
    } else {
      const addToParent = (nodes: Node[]): Node[] => {
        return nodes.map((node) => {
          if (node.id === parentId) {
            return {
              ...node,
              children: [...(node.children || []), newFile],
            };
          }
          if (node.children) {
            return { ...node, children: addToParent(node.children) };
          }
          return node;
        });
      };
      setTree(addToParent(tree));
    }
  };

  const deleteNode = (nodeId: string) => {
    if (!confirm("¿Eliminar este elemento?")) return;
    const removeFromTree = (nodes: Node[]): Node[] => {
      return nodes
        .filter((node) => node.id !== nodeId)
        .map((node) => {
          if (node.children) {
            return { ...node, children: removeFromTree(node.children) };
          }
          return node;
        });
    };
    setTree(removeFromTree(tree));
  };

  const renameNode = (nodeId: string) => {
    const findNode = (nodes: Node[]): Node | null => {
      for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const node = findNode(tree);
    if (!node) return;

    const newName = prompt("Nuevo nombre:", node.name);
    if (!newName) return;

    const renameInTree = (nodes: Node[]): Node[] => {
      return nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, name: newName };
        }
        if (node.children) {
          return { ...node, children: renameInTree(node.children) };
        }
        return node;
      });
    };
    setTree(renameInTree(tree));
  };

  if (loading) return <div style={{ padding: 24 }}>Cargando...</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1>📁 Panel de Administración</h1>

      <div style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => addFolder()} style={{ padding: "10px 20px", background: "#2e7d32", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
          📁 Nueva Carpeta (raíz)
        </button>
        <button onClick={() => addFile()} style={{ padding: "10px 20px", background: "#1976d2", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
          📄 Nuevo Archivo (raíz)
        </button>
        <button onClick={saveTree} disabled={isSaving} style={{ padding: "10px 20px", background: isSaving ? "#ccc" : "#f57c00", cursor: isSaving ? "not-allowed" : "pointer", color: "white", border: "none", borderRadius: 8 }}>
          {isSaving ? "⏳ Guardando..." : "💾 Guardar Cambios"}
        </button>
      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 20 }}>
        <h3>Estructura actual (Filtrada sin Drive):</h3>
        {/* Pasas directamente 'tree' porque ya está limpio y con los IDs sincronizados */}
        <TreeViewer
          nodes={tree}
          onAddFolder={addFolder}
          onAddFile={addFile}
          onDelete={deleteNode}
          onRename={renameNode}
        />
      </div>
    </div>
  );
}
// Componente TreeViewer sin cambios drásticos, solo removido el "!" innecesario
function TreeViewer({
  nodes,
  onAddFolder,
  onAddFile,
  onDelete,
  onRename,
  level = 0,
}: {
  nodes: Node[];
  onAddFolder: (parentId?: string) => void;
  onAddFile: (parentId?: string) => void;
  onDelete: (nodeId: string) => void;
  onRename: (nodeId: string) => void;
  level?: number;
}) {
  if (!nodes || nodes.length === 0) {
    return <div style={{ color: "#999", padding: 10 }}>Vacío</div>;
  }

  return (
    <div style={{ paddingLeft: level > 0 ? 20 : 0 }}>
      {nodes.map((node) => (
        <div
          key={node.id}
          style={{
            marginTop: 8,
            padding: "8px 12px",
            background: level % 2 === 0 ? "#f5f5f5" : "white",
            borderRadius: 4,
            border: "1px solid #eee",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>{node.type === "folder" ? "📁" : "📄"}</span>
            <span style={{ flex: 1, fontWeight: node.type === "folder" ? "bold" : "normal" }}>
              {node.name}
            </span>
            {node.type === "folder" && (
              <>
                <button
                  onClick={() => onAddFolder(node.id)}
                  style={{ background: "#2e7d32", color: "white", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}
                >
                  📁+
                </button>
                <button
                  onClick={() => onAddFile(node.id)}
                  style={{ background: "#1976d2", color: "white", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}
                >
                  📄+
                </button>
              </>
            )}
            <button
              onClick={() => onRename(node.id)}
              style={{ background: "#ff9800", color: "white", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(node.id)}
              style={{ background: "#f44336", color: "white", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}
            >
              🗑️
            </button>
          </div>
          {node.type === "folder" && node.children && node.children.length > 0 && (
            <TreeViewer
              nodes={node.children}
              onAddFolder={onAddFolder}
              onAddFile={onAddFile}
              onDelete={onDelete}
              onRename={onRename}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
}