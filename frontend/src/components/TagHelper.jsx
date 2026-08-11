import { useEffect, useState } from "react";
import { parseTags } from "../services/api";

const EMOTION_TAGS_EN = [
  "Neutral", "Happy", "Sad", "Angry", "Nervous", "Scared", "Whisper",
  "Excited", "Laugh", "Sigh", "Crying", "Serious", "Calm", "Confident",
  "Surprised", "Disappointed",
];

const EMOTION_TAGS_ZH = [
  "中性", "开心", "伤心", "生气", "紧张", "害怕", "耳语",
  "兴奋", "笑", "叹气", "哭泣", "严肃", "冷静", "自信",
  "惊讶", "失望",
];

const PAUSE_TAGS_EN = [
  { label: "... short pause", value: "..." },
  { label: ".... long pause", value: "...." },
];

const PAUSE_TAGS_ZH = [
  { label: "… 短停顿", value: "…" },
  { label: "…… 长停顿", value: "……" },
];

export default function TagHelper({ text, setText, textareaRef, defaultEmotion, language = "en" }) {
  const EMOTION_TAGS = language === "zh" ? EMOTION_TAGS_ZH : EMOTION_TAGS_EN;
  const PAUSE_TAGS = language === "zh" ? PAUSE_TAGS_ZH : PAUSE_TAGS_EN;
  
  const [segments, setSegments] = useState([]);
  const [previewError, setPreviewError] = useState("");
  const [customDuration, setCustomDuration] = useState("1.0");

  const insertAtCursor = (snippet) => {
    const el = textareaRef?.current;

    if (!el) {
      setText(text + snippet);
      return;
    }

    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const nextText = text.slice(0, start) + snippet + text.slice(end);

    setText(nextText);

    // restore focus and put the cursor right after the inserted snippet
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + snippet.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  useEffect(() => {
    if (!text.trim()) {
      setSegments([]);
      setPreviewError("");
      return;
    }

    // debounce so we're not hitting the backend on every keystroke
    const timeout = setTimeout(() => {
      parseTags(text, defaultEmotion)
        .then((result) => {
          setSegments(result);
          setPreviewError("");
        })
        .catch(() => {
          setPreviewError("Couldn't load preview — is the backend running?");
        });
    }, 500);

    return () => clearTimeout(timeout);
  }, [text, defaultEmotion]);

  return (
    <div className="mb-5">
      {/* Emotion tag buttons */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Insert Emotion Tag
        </label>
        <div className="flex flex-wrap gap-2">
          {EMOTION_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => insertAtCursor(`(${tag}) `)}
              className="px-3 py-1 text-xs bg-[#29292E] border border-white/20 rounded-full text-gray-300 hover:border-blue-500 hover:text-white transition"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Pause marker buttons */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Insert Pause
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {PAUSE_TAGS.map((pause) => (
            <button
              key={pause.value}
              type="button"
              onClick={() => insertAtCursor(pause.value)}
              className="px-3 py-1 text-xs bg-[#29292E] border border-white/20 rounded-full text-gray-300 hover:border-blue-500 hover:text-white transition"
            >
              {pause.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => insertAtCursor("[Pause]")}
            className="px-3 py-1 text-xs bg-[#29292E] border border-white/20 rounded-full text-gray-300 hover:border-blue-500 hover:text-white transition"
          >
            [Pause] default (1s)
          </button>

          {/* Custom-length pause: [Pause:X] */}
          <div className="flex items-center gap-1 pl-1">
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              className="w-16 px-2 py-1 text-xs bg-[#29292E] border border-white/20 rounded-md text-gray-200 outline-none focus:border-blue-500"
            />
            <span className="text-xs text-gray-400">s</span>
            <button
              type="button"
              onClick={() => {
                const seconds = parseFloat(customDuration);
                const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 1.0;
                insertAtCursor(`[Pause:${safeSeconds}]`);
              }}
              className="px-3 py-1 text-xs bg-[#29292E] border border-white/20 rounded-full text-gray-300 hover:border-blue-500 hover:text-white transition"
            >
              Insert custom pause
            </button>
          </div>
        </div>
      </div>

      {/* Live parse preview */}
      {(segments.length > 0 || previewError) && (
        <div className="p-3 bg-[#1F1F23] border border-white/10 rounded-lg">
          <p className="text-xs text-gray-400 mb-2">Preview breakdown</p>

          {previewError ? (
            <p className="text-xs text-red-400">{previewError}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {segments.map((seg, i) => {
                if (seg.type === "speech") {
                  return (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs bg-[#29292E] rounded-md text-gray-200"
                    >
                      <span className="text-blue-400 font-semibold">
                        {seg.emotion}:
                      </span>{" "}
                      "{seg.text}"
                    </span>
                  );
                }

                if (seg.type === "pause") {
                  return (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs bg-[#29292E] rounded-md text-purple-300"
                    >
                      ⏸ {seg.duration}s
                    </span>
                  );
                }

                // sfx
                return (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs bg-[#29292E] rounded-md text-yellow-300"
                  >
                    ✦ {seg.sfx}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
