import { useEffect, useRef } from "react";
import { voices } from "../services/voiceOptions";

export default function VoiceMenu({ selectedVoice, onSelect, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    // Force scroll to top on mount — guards against browser scroll
    // anchoring nudging the list to a non-zero scrollTop right after
    // it renders, which was hiding the first couple of items.
    if (menuRef.current) {
      menuRef.current.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{ overflowAnchor: "none" }}
      className="
        absolute bottom-full left-0 mb-2 z-50
        w-72 max-h-80 overflow-y-auto custom-scrollbar
        bg-[#2A2A2A] border border-white/20 rounded-xl
        shadow-2xl p-2
      "
    >
      {voices.map((voice) => (
        <button
          key={voice.name}
          onClick={() => {
            onSelect(voice.name);
            onClose();
          }}
          className={`
            w-full text-left px-3 py-2 rounded-lg text-sm
            transition
            ${voice.name === selectedVoice
              ? "bg-white/15 text-white"
              : "text-[#AAAAAA] hover:bg-white/5"}
          `}
        >
          <div className="font-medium">{voice.name}</div>
          <div className="text-xs text-[#8E8E8E]">
            {voice.gender}, {voice.age}, {voice.tone}
          </div>
        </button>
      ))}
    </div>
  );
}