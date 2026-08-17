const STORAGE_KEY = "voiceGeneratorProjects";

function loadProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load projects:", err);
    return [];
  }
}

function saveProjects(projects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error("Failed to save projects (storage may be full):", err);
  }
}

export function getProjects() {
  return loadProjects();
}

export function createProject(name = "New Project") {
  const projects = loadProjects();
  const newProject = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    messages: [],
  };
  const updated = [newProject, ...projects];
  saveProjects(updated);
  return newProject;
}

export function updateProjectMessages(projectId, messages) {
  const projects = loadProjects();
  const updated = projects.map((p) =>
    p.id === projectId ? { ...p, messages } : p
  );
  saveProjects(updated);
  return updated;
}

export function deleteProject(projectId) {
  const projects = loadProjects();
  const updated = projects.filter((p) => p.id !== projectId);
  saveProjects(updated);
  return updated;
}

export function renameProject(projectId, newName) {
  const projects = loadProjects();
  const updated = projects.map((p) =>
    p.id === projectId ? { ...p, name: newName } : p
  );
  saveProjects(updated);
  return updated;
}