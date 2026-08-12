import { useEffect, useState } from "react";
import { voices } from "../services/voiceOptions";
import { voicePresets as defaultPresets } from "../services/presetData";

export default function VoiceCard({
  selectedVoice,
  setSelectedVoice,
  speed,
  setSpeed,
}) {
  const [presets, setPresets] = useState(defaultPresets);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [presetName, setPresetName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [overwriteConfirm, setOverwriteConfirm] = useState(false);
  const [pendingPreset, setPendingPreset] = useState(null);

  useEffect(() => {
    const savedPresets = localStorage.getItem("voicePresets");

    if (savedPresets) {
      setPresets([...defaultPresets, ...JSON.parse(savedPresets)]);
    }
  }, []);

  const applyPreset = (preset) => {
    if (!preset) return;
    setSelectedVoice(preset.voice);
    setSpeed(preset.speed);
  };

  const savePreset = () => {
    if (!presetName.trim()) return;

    const newPreset = {
      name: presetName.trim(),
      voice: selectedVoice,
      speed: speed,
    };

    const savedPresets = JSON.parse(
      localStorage.getItem("voicePresets") || "[]"
    );

    const existingPreset = [...defaultPresets, ...savedPresets].find(
      (preset) => preset.name === newPreset.name
    );

    const isEditingCurrentPreset =
      selectedPreset === newPreset.name;

    if (existingPreset && !isEditingCurrentPreset) {
      setPendingPreset(newPreset);
      setOverwriteConfirm(true);
      return;
    }

    // Same name exists → ask for confirmation
    if (existingPreset) {
      setPendingPreset(newPreset);
      setOverwriteConfirm(true);
      return;
    }

    // Save new preset
    const updatedPresets = [...savedPresets, newPreset];

    localStorage.setItem(
      "voicePresets",
      JSON.stringify(updatedPresets)
    );

    setPresets([...defaultPresets, ...updatedPresets]);
    setSelectedPreset(newPreset.name);
    setPresetName("");
  };

  const overwritePreset = () => {
    if (!pendingPreset) return;

    const savedPresets = JSON.parse(
      localStorage.getItem("voicePresets") || "[]"
    );

    // Replace the existing preset
    const updatedPresets = [
      ...savedPresets.filter(
        (preset) => preset.name !== pendingPreset.name
      ),
      pendingPreset,
    ];

    localStorage.setItem(
      "voicePresets",
      JSON.stringify(updatedPresets)
    );

    setPresets([...defaultPresets, ...updatedPresets]);
    setSelectedPreset(pendingPreset.name);
    setPresetName("");

    setPendingPreset(null);
    setOverwriteConfirm(false);
  };

  const deletePreset = () => {
    if (!selectedPreset) return;

    const isDefaultPreset = defaultPresets.some(
      (preset) => preset.name === selectedPreset
    );

    if (isDefaultPreset) return;

    const savedPresets = JSON.parse(
      localStorage.getItem("voicePresets") || "[]"
    );

    const updatedPresets = savedPresets.filter(
      (preset) => preset.name !== selectedPreset
    );

    localStorage.setItem(
      "voicePresets",
      JSON.stringify(updatedPresets)
    );

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
                if (preset) {
                  applyPreset(preset);
                  setPresetName(presetName);
                } else {
                  setPresetName("");
                }
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
              bg-[#1F1F23]
              border border-white/20
              rounded-lg
              text-white
              font-semibold
              transition
              disabled:opacity-40
              disabled:cursor-not-allowed
            "
          >
            Save
          </button>
        </div>
      </div>

      {/* Overwrite Confirmation Modal */}
      {overwriteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-[400px] rounded-xl bg-[#29292E] border border-white/10 p-6 shadow-2xl">

            <h2 className="text-lg font-semibold text-white">
              Preset Already Exists
            </h2>

            <p className="mt-4 text-gray-300">
              A preset named{" "}
              <span className="text-white font-medium">
                "{pendingPreset?.name}"
              </span>{" "}
              already exists.
            </p>

            <p className="mt-3 text-sm text-gray-400">
              Do you want to replace it?
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setOverwriteConfirm(false);
                  setPendingPreset(null);
                }}
                className="
                  px-4 py-2
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
                onClick={overwritePreset}
                className="
                  px-4 py-2
                  rounded-lg
                  bg-blue-600
                  text-white
                  hover:bg-blue-700
                  transition
                "
              >
                Replace
              </button>
            </div>

          </div>
        </div>
      )}

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