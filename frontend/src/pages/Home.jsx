import PromptBox from "../components/PromptBox";
import SidePanel from "../components/SidePanel";
import AudioPlayer from "../components/AudioPlayer";
import { generateVoice as requestVoice } from "../services/api";
import { Download } from "lucide-react";
import { useRef, useState, useLayoutEffect } from "react";

export default function Home() {
  const textareaRef = useRef(null);

  const [barStyle, setBarStyle] = useState({ left: 0, width: "100%" });

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const updatePosition = () => {
      const rect = el.getBoundingClientRect();
      setBarStyle({ left: rect.left, width: rect.width });
    };

    updatePosition();

    const observer = new ResizeObserver(updatePosition);
    observer.observe(el);
    window.addEventListener("resize", updatePosition);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
    };
  }, []);

  const [clicked, setClicked] = useState(false);
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audio, setAudio] = useState(null);

  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  { /* State for voice options */ }
  const [selectedVoice, setSelectedVoice] = useState("Ethan");

  { /* State for speech controls */ }
  const [speed, setSpeed] = useState(1);

  const [language, setLanguage] = useState("auto");

  const generateVoice = async () => {
    if (!text.trim()) {
      setError("Please enter text to generate voice.");
      return;
    }

    setError("");
    setClicked(true);
    setIsGenerating(true);

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setAudio(null);
    }

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl(null);

    try {
      const audioBlob = await requestVoice({
        text: text,
        voice: selectedVoice,
        speed: speed,
        language: language === "zh" ? "zh-cn" : language === "en" ? "en" : "auto",
      });

      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      const newAudio = new Audio(url);

      newAudio.onloadedmetadata = () => {
        setDuration(newAudio.duration);
      };

      newAudio.ontimeupdate = () => {
        setCurrentTime(newAudio.currentTime);
      };

      newAudio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      setAudio(newAudio);

      // autoplay after generated
      newAudio.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Autoplay blocked:", err);
          setIsPlaying(false);
        });

      console.log("Audio generated successfully:", audioBlob);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to generate voice. Please try again.");
    } finally {
      setClicked(false);
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen">
        {/* Main content */}
        <div className="flex-1 lg:px-25 md:px-16 sm:px-16 pt-14 pb-24">
          {/* Heading */}
          <h1 className="text-2xl font-semibold text-center mb-16">
            Welcome to Voice Generator !
          </h1>

          <PromptBox
            ref={textareaRef}
            text={text}
            setText={setText}
            language={language}
          />

          {/* Action row: download (left) + generate (right) */}
          <div className="flex items-center justify-between mt-4 mb-4">
            <button
              onClick={() => {
                if (!audioUrl) return;
                const link = document.createElement("a");
                link.href = audioUrl;
                link.download = "speech.wav";
                link.click();
              }}
              disabled={!audioUrl}
              className="
                p-2
                text-gray-400
                hover:text-white
                transition
                disabled:opacity-30
                disabled:cursor-not-allowed
              "
              title="Download .wav"
            >
              <Download className="w-7 h-7" strokeWidth={2.5} />
            </button>

            <button
              onClick={generateVoice}
              disabled={clicked || !text.trim()}
              className="
                px-5 h-11 w-35
                flex items-center justify-center
                bg-white/20
                border border-white/20
                rounded-2xl
                text-base text-white font-semibold
                active:scale-95 transition
                disabled:opacity-40
              "
            >
              {clicked ? "Generating..." : "Generate"}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <p className="mt-2 text-red-400 text-sm">
              {error}
            </p>
          )}
        </div>

        {/* Side panel (desktop) */}
        <aside className="
          hidden md:flex md:flex-col md:justify-center
          w-[360px] shrink-0
          border-l-8 border-[#1A1A1D]
          sticky top-0 h-screen
          overflow-y-auto
          custom-scrollbar
          px-8 py-6
        ">
          <SidePanel
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            speed={speed}
            setSpeed={setSpeed}
          />
        </aside>
      </div>

      {/* Side panel content (mobile, stacked below main content) */}
      <div className="md:hidden px-6 pb-24">
        <SidePanel
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          speed={speed}
          setSpeed={setSpeed}
        />
      </div>

      {/* Fixed bottom audio bar */}
      <AudioPlayer
        audio={audio}
        audioUrl={audioUrl}
        isGenerating={isGenerating}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        currentTime={currentTime}
        setCurrentTime={setCurrentTime}
        duration={duration}
        barStyle={barStyle}
      />
    </>
  );
}