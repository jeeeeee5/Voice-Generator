import { voices } from "../services/voiceOptions";

export default function VoiceCard({
  selectedVoice,
  setSelectedVoice,
}) {
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
    </div>
  );
}