import { useEffect, useRef, useState } from "react";
import { SquarePen, Trash2 } from "lucide-react";

export default function Sidebar({
  projects,
  currentProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onRenameProject,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [contextMenu, setContextMenu] = useState(null); // { projectId, x, y }
  const menuRef = useRef(null);

  useEffect(() => {
    if (!contextMenu) return;

    const closeMenu = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [contextMenu]);

  const startEditing = (project) => {
    setEditingId(project.id);
    setEditingName(project.name);
    setContextMenu(null);
  };

  const commitRename = () => {
    const trimmed = editingName.trim();
    if (editingId && trimmed) {
      onRenameProject(editingId, trimmed);
    }
    setEditingId(null);
    setEditingName("");
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleContextMenu = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ projectId: project.id, x: e.clientX, y: e.clientY });
  };

  return (
    <aside className="w-[260px] shrink-0 bg-[#2A2A2A] h-screen sticky top-0 flex flex-col px-3 py-4 overflow-y-auto custom-scrollbar">
      <button
        onClick={onCreateProject}
        className="
          flex items-center gap-2
          px-3 py-2 mt-15 mb-8
          hover:bg-[#333333]
          rounded-lg
          text-sm text-white font-medium
          transition
        "
      >
        <SquarePen className="w-4 h-4 text-white" />
        Create Voice
      </button>

      <span className="px-3 text-xs font-medium text-[#8E8E8E] mb-2">
        Chats
      </span>

      <div className="flex flex-col gap-1">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`
              group flex items-center justify-between
              px-3 py-2 rounded-lg cursor-pointer text-sm
              ${project.id === currentProjectId
                ? "bg-[#333333] text-white"
                : "text-[#AAAAAA] hover:bg-[#333333]/60 hover:text-gray-200"}
            `}
            onClick={() => {
              if (editingId !== project.id) onSelectProject(project.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              startEditing(project);
            }}
            onContextMenu={(e) => handleContextMenu(e, project)}
          >
            {editingId === project.id ? (
              <input
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") cancelRename();
                }}
                className="
                  flex-1 bg-transparent 
                  text-white text-sm outline-none
                "
              />
            ) : (
              <span className="truncate">{project.name}</span>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteProject(project.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-[#8E8E8E] hover:text-red-400 transition"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {contextMenu && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: contextMenu.y, left: contextMenu.x }}
          className="
            z-50 w-36
            bg-[#2A2A2A] border border-white/20 rounded-lg
            shadow-2xl py-1
          "
        >
          <button
            onClick={() => {
              const project = projects.find((p) => p.id === contextMenu.projectId);
              if (project) startEditing(project);
            }}
            className="w-full text-left px-3 py-2 text-sm text-white hover:bg-white/5 transition"
          >
            Rename
          </button>
          <button
            onClick={() => {
              onDeleteProject(contextMenu.projectId);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 transition"
          >
            Delete
          </button>
        </div>
      )}
    </aside>
  );
}