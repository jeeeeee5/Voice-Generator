import { useEffect, useRef, useState } from "react";
import { ArrowUp, SlidersHorizontal } from "lucide-react";
import Sidebar from "../components/Sidebar";
import VoiceMenu from "../components/VoiceMenu";
import MessageAudioPlayer from "../components/MessageAudioPlayer";
import { generateVoice as requestVoice } from "../services/api";
import {
  getProjects,
  createProject,
  updateProjectMessages,
  deleteProject,
  renameProject,
} from "../services/projectStorage";

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);

  const [text, setText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("Ethan");
  const [speed, setSpeed] = useState(1);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);
  const [lastMessageId, setLastMessageId] = useState(null);

  const messagesEndRef = useRef(null);

  const [isDraggingSpeed, setIsDraggingSpeed] = useState(false);

  useEffect(() => {
    const loaded = getProjects();
    if (loaded.length === 0) {
      const first = createProject("Project 1");
      setProjects([first]);
      setCurrentProjectId(first.id);
    } else {
      setProjects(loaded);
      setCurrentProjectId(loaded[0].id);
    }
  }, []);

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const messages = currentProject?.messages ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleCreateProject = () => {
    const newProject = createProject(`Project ${projects.length + 1}`);
    setProjects([newProject, ...projects]);
    setCurrentProjectId(newProject.id);
    setLastMessageId(null);
    setText("");
  };

  const handleDeleteProject = (id) => {
    const updated = deleteProject(id);

    if (updated.length === 0) {
      const newProject = createProject("Project 1");
      setProjects([newProject]);
      setCurrentProjectId(newProject.id);
      setLastMessageId(null);
      setText("");
      return;
    }

    setProjects(updated);
    if (id === currentProjectId) {
      setCurrentProjectId(updated[0]?.id ?? null);
      setLastMessageId(null);
    }
  };

  const handleRenameProject = (projectId, newName) => {
    const updated = renameProject(projectId, newName);
    setProjects(updated);
  };

  const handleSelectProject = (projectId) => {
    setCurrentProjectId(projectId);
    setLastMessageId(null);
  };

  const generateVoice = async () => {
    if (!text.trim()) {
      setError("Please enter text to generate voice.");
      return;
    }

    if (!currentProjectId) {
      setError("No active project — please try again.");
      return;
    }

    setError("");
    setIsGenerating(true);

    // Insert a placeholder "Generating..." message immediately
    const placeholderId = crypto.randomUUID();
    const placeholderMessage = {
      id: placeholderId,
      text,
      voice: selectedVoice,
      speed,
      audioDataUrl: null,
      isGenerating: true,
      createdAt: Date.now(),
    };

    const messagesWithPlaceholder = [...messages, placeholderMessage];
    let updatedProjects = updateProjectMessages(currentProjectId, messagesWithPlaceholder);
    setProjects(updatedProjects);
    

    try {
      const audioBlob = await requestVoice({
        text,
        voice: selectedVoice,
        speed,
        language: "auto",
      });

      const audioDataUrl = await blobToDataURL(audioBlob);

      // Replace the placeholder with the finished message
      const finalMessages = messagesWithPlaceholder.map((msg) =>
        msg.id === placeholderId
          ? { ...msg, audioDataUrl, isGenerating: false }
          : msg
      );

      updatedProjects = updateProjectMessages(currentProjectId, finalMessages);
      setProjects(updatedProjects);
      setLastMessageId(placeholderId);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to generate voice. Please try again.");

      // Remove the placeholder on failure so it doesn't stay stuck as "Generating..."
      const messagesWithoutPlaceholder = messagesWithPlaceholder.filter(
        (msg) => msg.id !== placeholderId
      );
      updatedProjects = updateProjectMessages(currentProjectId, messagesWithoutPlaceholder);
      setProjects(updatedProjects);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={handleSelectProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={handleRenameProject}
      />

      <div className="flex-1 flex flex-col h-screen">
        {/* Message list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-16 py-10">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <h1 className="text-2xl font-semibold mb-6 text-white">
                Welcome to Voice Generator!
              </h1>
              <p className="text-[#8E8E8E] text-sm">
                Write in text box to generate voice.
              </p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto flex flex-col gap-6">
              {messages.map((msg) => (
                <MessageAudioPlayer
                  key={msg.id}
                  audioUrl={msg.audioDataUrl}
                  autoPlay={msg.id === lastMessageId}
                  isGenerating={msg.isGenerating}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom input bar */}
        <div className="px-6 md:px-16 pb-8 pt-2">
          <div className="max-w-2xl mx-auto relative">
            <div className="bg-[#2A2A2A] rounded-2xl p-4">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write descriptions here..."
                rows={8}
                className="
                  w-full bg-transparent text-[#8E8E8E] text-sm
                  placeholder:text-[#8E8E8E] resize-none outline-none mb-3
                "
              />

              <div className="flex items-center gap-4">
                <div className="relative">
                  <button
                    onClick={() => setShowVoiceMenu((v) => !v)}
                    className="
                      flex items-center gap-1.5 font-medium text-xs text-gray-400
                      hover:text-white transition
                    "
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Voice
                  </button>

                  {showVoiceMenu && (
                    <VoiceMenu
                      selectedVoice={selectedVoice}
                      onSelect={setSelectedVoice}
                      onClose={() => setShowVoiceMenu(false)}
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 font-medium text-xs text-[#AAAAAA]">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Speed
                  </span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.05"
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    onMouseDown={() => setIsDraggingSpeed(true)}
                    onMouseUp={() => setIsDraggingSpeed(false)}
                    onTouchStart={() => setIsDraggingSpeed(true)}
                    onTouchEnd={() => setIsDraggingSpeed(false)}
                    className="w-32 thin-slider"
                  />
                  {isDraggingSpeed && (
                    <span className="text-xs text-[#AAAAAA] w-8 shrink-0">
                      {speed.toFixed(2)}x
                    </span>
                  )}
                </div>

                <div className="flex-1" />

                <button
                  onClick={generateVoice}
                  disabled={isGenerating || !text.trim()}
                  className={`
                    w-5 h-5 flex items-center justify-center
                    rounded-full transition disabled:opacity-40
                    ${text.trim() ? "bg-white hover:bg-white/90" : "bg-white/20 hover:bg-white/30"}
                  `}
                >
                  <ArrowUp className="w-3 h-3 text-black" strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {error && (
              <p className="mt-2 text-red-400 text-xs">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}