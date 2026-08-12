export default function SettingsPanel({

  speed,
  setSpeed,
}) {
  return (
    <div className="space-y-4 mt-4 mb-8">

      {/* Speech Speed */}
      <div>
        <div className="flex justify-between mb-1">
          <label className="text-sm text-gray-300">
            Speed
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

    </div>
  );
}