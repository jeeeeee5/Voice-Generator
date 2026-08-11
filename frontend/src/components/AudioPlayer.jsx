import { useEffect, useRef, useState } from "react";
import { VolumeX, Volume1, Volume2, Play, Pause, Download, X } from "lucide-react";

export default function AudioPlayer({
  audio,
  audioUrl,
  hasAudio,
  isGenerating,
  waveform,
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime,
  duration,
  volume,
  setVolume,
  removeOutput,
}) {
  const [showVolume, setShowVolume] = useState(false);
  const volumeRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (volumeRef.current && !volumeRef.current.contains(event.target)) {
        setShowVolume(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleDownload = () => {
    if (!audioUrl) return;

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = "speech.wav";
    link.click();
  };

  return (
    <div className="mb-10 md:mb-0">
      {/* Output panel — glow 只作用于 panel */}
      <div className="relative">
        {/* Glow */}
        <div className="absolute -inset-1 rounded-xl bg-purple-500/20 blur-xl pointer-events-none" />

        {/* Panel */}
        <div className="
          relative
          bg-[#1F1F23]
          border-2 border-white/20
          rounded-xl
          p-4
          h-fit
        ">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xl">
              Generated Audio Output:
            </h2>

            <button
              onClick={removeOutput}
              disabled={!hasAudio}
              className="
                p-1
                text-gray-400
                hover:text-white
                hover:bg-gray-700
                rounded-md
                transition
                disabled:opacity-30
                disabled:cursor-not-allowed
              "
              title="Remove output"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Waveform */}
          <div className="flex items-center gap-[3px] h-16 mb-4">
            {waveform.map((h, i) => (
              <div
                key={i}
                className="w-[2px] rounded-full"
                style={{
                  height: `${h}%`,
                  background: hasAudio
                    ? "linear-gradient(180deg, #a78bfa, #6366f1)"
                    : "#2a2e3a",
                }}
              />
            ))}
          </div>

          {/* Audio controls */}
          <div className="flex items-center gap-3 mb-4 p-4 bg-[#29292E] rounded-lg">
            {/* Play */}
            <button
              onClick={() => {
                if (!audio || isGenerating) return;

                if (isPlaying) {
                  audio.pause();
                  setIsPlaying(false);
                } else {
                  audio.play();
                  setIsPlaying(true);
                }
              }}
              disabled={!audio || isGenerating}
              className="
                hover:bg-gray-700
                active:scale-95
                transition
                disabled:opacity-40
              "
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-white" />
              ) : (
                <Play className="w-5 h-5 fill-white" />
              )}
            </button>

            {/* Progress */}
            <div
              className="
                flex-1 h-1 bg-gray-700
                rounded-full relative cursor-pointer
              "
              onClick={(e) => {
                if (!audio || !duration) return;

                const rect = e.currentTarget.getBoundingClientRect();
                const clickPosition = e.clientX - rect.left;
                const percentage = clickPosition / rect.width;

                audio.currentTime = percentage * duration;
                setCurrentTime(audio.currentTime);
              }}
            >
              <div
                className="absolute top-0 left-0 h-1 bg-white rounded-full"
                style={{
                  width: duration ? `${(currentTime / duration) * 100}%` : "0%",
                }}
              />

              <div
                className="
                  absolute top-1/2 -translate-y-1/2
                  w-3 h-3 bg-white rounded-full
                "
                style={{
                  left: duration ? `${(currentTime / duration) * 100}%` : "0%",
                }}
              />
            </div>

            {/* Time */}
            <span className="text-gray-400 text-sm whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume */}
            <div ref={volumeRef} className="relative flex items-center">
              <button
                onClick={() => setShowVolume(!showVolume)}
                className="
                  p-1 text-white
                  hover:bg-gray-700
                  rounded-md transition
                "
              >
                {volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              {showVolume && (
                <div className="
                  absolute bottom-8 left-1/2 -translate-x-1/2
                  bg-[#29292E]
                  border border-white/20
                  rounded-lg
                  p-2
                  shadow-lg
                  z-10
                ">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => {
                      const newVolume = Number(e.target.value);
                      setVolume(newVolume);

                      if (audio) {
                        audio.volume = newVolume;
                      }
                    }}
                    className="w-20 accent-white"
                  />
                </div>
              )}
            </div>

            {/* Small download */}
            <button
              onClick={handleDownload}
              disabled={!audioUrl}
              className="
                p-1
                text-gray-300
                hover:text-white
                transition
                disabled:opacity-40
                disabled:cursor-not-allowed
              "
            >
              <Download className="w-5 h-5 fill-white" strokeWidth={1.75} />
            </button>
          </div>

          {/* File name */}
          {hasAudio && (
            <div className="
              flex items-center
              w-fit
              mb-4
              px-2 py-1
              bg-[#29292E]/95
              rounded-lg
            ">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />

                <span className="text-gray-300 text-md">
                  speech.wav
                </span>
              </div>
            </div>
          )}

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={!audioUrl}
            className="
              w-full
              flex items-center justify-center gap-2
              p-2
              border-2 border-white/20
              rounded-lg
              text-gray-300
              hover:bg-[#29292E]
              transition
              disabled:opacity-40
              disabled:cursor-not-allowed
            "
          >
            <Download className="w-5 h-5 fill-white" strokeWidth={1.75} />

            <span className="text-gray-300 text-lg font-semibold">
              Download .WAV File
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
