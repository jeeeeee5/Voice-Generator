import { Play, Pause, Download, } from "lucide-react";

export default function AudioPlayer({
  audio,
  audioUrl,
  isGenerating,
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime,
  duration,
  volume,
  setVolume,
}) {


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

          {/* Audio controls */}
          <div className="flex items-center gap-3 p-3 bg-[#29292E] rounded-xl border-2 border-white/20">
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
              <Download className="w-5 h-5 text-gray-300" strokeWidth={1.75} />
            </button>
          </div>

    </div>
  );
}
