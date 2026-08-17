import { useRef, useState, useEffect } from "react";
import { Play, Pause, Download } from "lucide-react";

export default function MessageAudioPlayer({ audioUrl, autoPlay = false, isGenerating = false }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [autoPlay, audioUrl]);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = "speech.wav";
    link.click();
  };

  return (
    <div className="mb-2">
      <div className="bg-[#2A2A2A] rounded-xl px-5 py-4">
        <audio
          ref={audioRef}
          src={audioUrl}
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          className="hidden"
        />

        <div className={`flex items-center gap-7 ${isGenerating ? "opacity-40" : ""}`}>
          <button
            disabled={isGenerating}
            onClick={() => {
              if (!audioRef.current) return;
              if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
              } else {
                audioRef.current.play();
                setIsPlaying(true);
              }
            }}
            className={`
              w-7 h-7 flex items-center justify-center
              rounded-full active:scale-95 transition shrink-0
              disabled:cursor-not-allowed
              ${isGenerating ? "bg-[#8E8E8E] text-black" : "bg-white text-black"}
            `}
          >
            {isPlaying ? (
              <Pause className="w-3 h-3 fill-black" />
            ) : (
              <Play className="w-3 h-3 fill-black ml-0.5" />
            )}
          </button>

          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs text-[#AAAAAA] shrink-0 mr-0">
              {formatTime(currentTime)}
            </span>

            <div
              className={`flex-1 h-1 bg-[#333333] rounded-full relative ${isGenerating ? "" : "cursor-pointer"}`}
              onClick={(e) => {
                if (isGenerating || !audioRef.current || !duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const percentage = (e.clientX - rect.left) / rect.width;
                audioRef.current.currentTime = percentage * duration;
                setCurrentTime(audioRef.current.currentTime);
              }}
            >
              <div
                className="absolute top-0 left-0 h-1 bg-white rounded-full"
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"
                style={{ left: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
              />
            </div>

            <span className="text-xs text-[#AAAAAA] shrink-0 text-right ml-0">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {isGenerating ? (
        <p className="mt-1 text-xs text-white opacity-40">Generating...</p>
      ) : (
        <button
          onClick={handleDownload}
          className="mt-1 flex items-center gap-2 text-xs text-white transition"
        >
          Generated.{"  "}
          <Download className="w-4 h-4 text-white hover:text-white transition" />
        </button>
      )}
    </div>
  );
}