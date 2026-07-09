"use client";
import { useState, useEffect } from "react";

// Definir el tipo de los nodos
interface Node {
  id?: string;
  name: string;
  type: string;
  url?: string;
  children?: Node[];
  source?: string;
}



export default function AdminPanel() {
  const [tree, setTree] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar el árbol actual
  useEffect(() => {
    fetch("/api/tree")
      .then((r) => {
        if (!r.ok) throw new Error("Error al cargar");
        return r.json();
      })
      .then((data) => {
        setTree(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // 🔥 FILTRAR: Solo mostrar archivos EXTERNOS (no de Drive)
  const filterDriveNodes = (nodes: Node[]): Node[] => {
    const result: Node[] = [];
    for (const node of nodes) {
      if (node.type === "folder") {
        // Las carpetas se mantienen siempre (son estructura)
        const filteredChildren = node.children ? filterDriveNodes(node.children) : [];
        result.push({ ...node, children: filteredChildren });
      } else if (node.source !== "drive") {
        // 🔥 SOLO archivos que NO son de Drive
        result.push(node);
      }
      // Los archivos de Drive NO se muestran
    }
    return result;
  };

  const externalTree = filterDriveNodes(tree);

  // Guardar cambios
  const saveTree = async (newTree: Node[]) => {
    setIsSaving(true); //desactivar botón
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tree: newTree }),
      });
      
      if (!res.ok) throw new Error("Error al guardar");
      
      setLoading(false);
      alert("✅ JSON actualizado!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error desconocido");
      }
      setLoading(false);
    }

    setIsSaving(false); //reactiva botón
  };

  // Función para agregar una carpeta
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

  // Función para agregar un archivo
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

  // Función para eliminar un nodo
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

  // Función para renombrar
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
        <button
          onClick={() => addFolder()}
          style={{
            padding: "10px 20px",
            background: "#2e7d32",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          📁 Nueva Carpeta (raíz)
        </button>
        <button
          onClick={() => addFile()}
          style={{
            padding: "10px 20px",
            background: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          📄 Nuevo Archivo (raíz)
        </button>
        <button
          onClick={() => saveTree(tree)}
          disabled={isSaving}
          style={{
            padding: "10px 20px",
            background: isSaving ? "#ccc" : "#f57c00",
            cursor: isSaving ? "not-allowed" : "pointer",
            color: "white",
            border: "none",
            borderRadius: 8,            
          }}
        >
        {isSaving ? "⏳ Guardando..." : "💾 Guardar"}
        </button>

      </div>

      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 20 }}>
        <h3>Estructura actual:</h3>
        <TreeViewer
          nodes={externalTree}
          onAddFolder={addFolder}
          onAddFile={addFile}
          onDelete={deleteNode}
          onRename={renameNode}
        />
      </div>
    </div>
  );
}

// Componente para mostrar el árbol
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
                  style={{
                    background: "#2e7d32",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    padding: "2px 8px",
                    cursor: "pointer",
                  }}
                >
                  📁+
                </button>
                <button
                  onClick={() => onAddFile(node.id)}
                  style={{
                    background: "#1976d2",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    padding: "2px 8px",
                    cursor: "pointer",
                  }}
                >
                  📄+
                </button>
              </>
            )}
            <button
              onClick={() => onRename(node.id!)}
              style={{
                background: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: 4,
                padding: "2px 8px",
                cursor: "pointer",
              }}
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(node.id!)}
              style={{
                background: "#f44336",
                color: "white",
                border: "none",
                borderRadius: 4,
                padding: "2px 8px",
                cursor: "pointer",
              }}
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