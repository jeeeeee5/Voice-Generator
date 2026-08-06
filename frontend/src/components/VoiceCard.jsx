import { useEffect, useState } from "react";
import { voices, voiceStyles, emotions, speakingStyles } from "../services/voiceOptions";
import { voicePresets as defaultPresets } from "../services/presetData";

export default function VoiceCard({
  selectedVoice,
  setSelectedVoice,
  selectedVoiceStyle,
  setSelectedVoiceStyle,
  selectedEmotion,
  setSelectedEmotion,
  selectedSpeakingStyle,
  setSelectedSpeakingStyle,
  emotionLevel,
  setEmotionLevel,
  speed,
  setSpeed,
  pitch,
  setPitch,
  expressiveness,
  setExpressiveness,
}) {
  const [presets, setPresets] = useState(defaultPresets);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [presetName, setPresetName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    const savedPresets = localStorage.getItem("voicePresets");

    if (savedPresets) {
      setPresets([...defaultPresets, ...JSON.parse(savedPresets)]);
    }
  }, []);

  const applyPreset = (preset) => {
    if (!preset) return;
    setSelectedVoice(preset.voice);
    setSelectedVoiceStyle(preset.style);
    setSelectedSpeakingStyle(preset.speakingStyle);
    setSelectedEmotion(preset.emotion);
    setEmotionLevel(preset.emotionLevel);
    setSpeed(preset.speed);
    setPitch(preset.pitch);
    setExpressiveness(preset.expressiveness);
  };

  const savePreset = () => {
    if (!presetName.trim()) return;

    const newPreset = {
      name: presetName.trim(),
      voice: selectedVoice,
      style: selectedVoiceStyle,
      speakingStyle: selectedSpeakingStyle,
      emotion: selectedEmotion,
      emotionLevel: emotionLevel,
      speed: speed,
      pitch: pitch,
      expressiveness: expressiveness,
    };

    const savedPresets = JSON.parse(localStorage.getItem("voicePresets") || "[]");

    const updatedPresets = [
      ...savedPresets.filter((preset) => preset.name !== newPreset.name),
      newPreset,
    ];

    localStorage.setItem("voicePresets", JSON.stringify(updatedPresets));

    setPresets([...defaultPresets, ...updatedPresets]);
    setSelectedPreset(newPreset.name);
    setPresetName("");
  };

  const deletePreset = () => {
    if (!selectedPreset) return;

    const isDefaultPreset = defaultPresets.some((preset) => preset.name === selectedPreset);
    if (isDefaultPreset) return;

    const savedPresets = JSON.parse(localStorage.getItem("voicePresets") || "[]");
    const updatedPresets = savedPresets.filter((preset) => preset.name !== selectedPreset);

    localStorage.setItem("voicePresets", JSON.stringify(updatedPresets));
    setPresets([...defaultPresets, ...updatedPresets]);
    setSelectedPreset("");
  };

  return (
    <div className="relative">
      {/* Voice */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-2">Voice</label>

        <select
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          style={{ backgroundColor: "#29292E" }}
          className="w-full bg-[#29292E] text-gray-200 border border-white/20 rounded-lg px-3 py-2.5 outline-none "
        >
          {voices.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {voice.name} — {voice.gender}, {voice.age}, {voice.tone}
            </option>
          ))}
        </select>
      </div>

      {/* Voice Style */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-2">Voice Style</label>

        <select
          value={selectedVoiceStyle}
          onChange={(e) => setSelectedVoiceStyle(e.target.value)}
          className="w-full bg-[#29292E] text-gray-200 border border-white/20 rounded-lg px-3 py-2.5 outline-none"
        >
          {voiceStyles.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
      </div>

      {/* Emotion */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-2">Emotion</label>

        <select
          value={selectedEmotion}
          onChange={(e) => setSelectedEmotion(e.target.value)}
          className="w-full bg-[#29292E] text-gray-200 border border-white/20 rounded-lg px-3 py-2.5 outline-none"
        >
          {emotions.map((emotion) => (
            <option key={emotion} value={emotion}>
              {emotion}
            </option>
          ))}
        </select>
      </div>

      {/* Speaking Style */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-2">Speaking Style</label>

        <select
          value={selectedSpeakingStyle}
          onChange={(e) => setSelectedSpeakingStyle(e.target.value)}
          className="w-full bg-[#29292E] text-gray-200 border border-white/20 rounded-lg px-3 py-2.5 outline-none"
        >
          {speakingStyles.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
      </div>

      {/* Voice Preset */}
      <div className="mb-4">
        <label className="block text-gray-300 text-sm font-semibold mb-2">Voice Preset</label>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <select
              value={selectedPreset}
              onChange={(e) => {
                const presetName = e.target.value;
                setSelectedPreset(presetName);

                const preset = presets.find((p) => p.name === presetName);
                if (preset) applyPreset(preset);
              }}
              className="
                w-full
                h-12
                px-4
                pr-10
                bg-[#29292E]
                border border-white/20
                rounded-lg
                text-gray-200
                outline-none
                focus:border-blue-500
              "
            >
              <option value="">None</option>

              {presets.map((preset) => (
                <option key={preset.name} value={preset.name}>
                  {preset.name}
                </option>
              ))}
            </select>

            {/* Delete preset */}
            {selectedPreset && !defaultPresets.some((preset) => preset.name === selectedPreset) && (
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="
                  absolute
                  right-8
                  top-1/2
                  -translate-y-1/2
                  w-6 h-6
                  flex items-center justify-center
                  text-gray-400
                  hover:text-red-400
                  hover:bg-red-500/10
                  rounded
                  transition
                  z-10
                "
                title="Delete preset"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name..."
            className="
              flex-1
              h-10
              px-3
              bg-[#29292E]
              border border-white/20
              rounded-lg
              text-gray-300
              outline-none
              focus:border-blue-500
            "
          />

          {/* Save button */}
          <button
            onClick={savePreset}
            disabled={!presetName.trim()}
            className="
              w-20
              px-4
              h-10
              bg-[#000042]
              border border-blue-500
              rounded-lg
              text-white
              font-semibold
              hover:bg-blue-950
              transition
              disabled:opacity-40
              disabled:cursor-not-allowed
            "
          >
            Save
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-[300px] rounded-xl bg-[#29292E] border-2 border-white/10 p-4">

            <h2 className="text-lg font-semibold text-white">
              Delete Voice Preset
            </h2>

            <p className="mt-2 text-gray-300">
              Are you sure you want to delete
            </p>

            <p className="mt-1 text-gray-300">
              "<span className="text-white font-medium">{selectedPreset}</span>"?
            </p>

            <p className="mt-3 text-sm text-gray-400">
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 mt-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="
                  px-2 py-1
                  rounded-lg
                  text-gray-300
                  hover:bg-white/10
                  transition
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  deletePreset();
                  setDeleteConfirm(false);
                }}
                className="
                  px-2 py-1
                  rounded-lg
                  bg-red-600
                  text-white
                  hover:bg-red-700
                  transition
                "
              >
                Delete
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
