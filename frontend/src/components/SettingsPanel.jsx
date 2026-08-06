export default function SettingsPanel({
  speed,
  setSpeed,
  pitch,
  setPitch,
  volume,
  setVolume,
  emotionLevel,
  setEmotionLevel,
  expressiveness,
  setExpressiveness,
}) {
  return (
    <div className="space-y-4 mt-5">

      {/* Speech Speed */}
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-sm text-gray-300">
            Speech Speed
          </label>
          <span className="text-sm text-gray-400">
            {speed.toFixed(1)}x
          </span>
        </div>

        <input
          type="range"
          min="0.5"
          max="2"
          step="0.05"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-full accent-white"
        />
      </div>

      {/* Pitch */}
        <div>
        <div className="flex justify-between mb-1">
            <label className="text-sm text-gray-300">
            Pitch
            </label>

            <span className="text-sm text-gray-400">
            {pitch}
            </span>
        </div>

        <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={pitch + 10}
            onChange={(e) => setPitch(Number(e.target.value) - 10)}
            className="w-full accent-white"
        />
        </div>

      {/* Volume */}
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-sm text-gray-300">
            Volume
          </label>
          <span className="text-sm text-gray-400">
            {Math.round(volume * 100)}%
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full accent-white"
        />
      </div>

      {/* Emotion Level */}
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-sm text-gray-300">
            Emotion Level
          </label>
          <span className="text-sm text-gray-400">
            {emotionLevel}%
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={emotionLevel}
          onChange={(e) => setEmotionLevel(Number(e.target.value))}
          className="w-full accent-white"
        />
      </div>

      {/* Expressiveness */}
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-sm text-gray-300">
            Expressiveness
          </label>
          <span className="text-sm text-gray-400">
            {expressiveness}%
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={expressiveness}
          onChange={(e) => setExpressiveness(Number(e.target.value))}
          className="w-full accent-white"
        />
      </div>

    </div>
  );
}
