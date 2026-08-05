import { voices, voiceStyles, emotions, speakingStyles, } from "../services/voiceOptions";

function VoiceControls({
  selectedVoice,
  setSelectedVoice,
  selectedVoiceStyle,
  setSelectedVoiceStyle,
  selectedEmotion,
  setSelectedEmotion,
  selectedSpeakingStyle,
  setSelectedSpeakingStyle,
}) {
  return (
    <div className="relative">
      {/* Voice */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Voice
        </label>

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
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Voice Style
        </label>

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
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Emotion
        </label>

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
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Speaking Style
        </label>

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
    </div>
  );
}

export default VoiceControls;