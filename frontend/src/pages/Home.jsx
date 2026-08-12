import { useRef, useState } from "react";
import PromptBox from "../components/PromptBox";
import VoiceCard from "../components/VoiceCard";
import SettingsPanel from "../components/SettingsPanel";
import AudioPlayer from "../components/AudioPlayer";
import { generateVoice as requestVoice } from "../services/api";


export default function Home() {
  const textareaRef = useRef(null);
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
  const [selectedVoice, setSelectedVoice] = useState("Michael");

  { /* State for speech controls */ }
  const [speed, setSpeed] = useState(1);

  const [language, setLanguage] = useState("en"); // "en" | "zh"

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

    if(audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl(null);

    try {
      const audioBlob = await requestVoice({
        text: text,
        voice: selectedVoice,
        speed: speed,
        language: language === "zh" ? "zh-cn" : "en",
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
    <section className="pt-6 px-6 md:px-28 xl:px-32">
      {/* Heading */}
      <h1 className="text-4xl font-bold mb-2">
        Voice Generator
      </h1>

      <p className="text-indigo-300/80 text-2xl mb-6">
        Local TTS Engine
      </p>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6">
        {/* Left side */}
        <div className="mb-4">
          <PromptBox
            ref={textareaRef}
            text={text}
            setText={setText}
            language={language}
          />

          {/* Generate buttons */}
          <div className="flex gap-3 mt-4 mb-4">
            <button
              onClick={generateVoice}
              disabled={clicked || !text.trim()}
              className="
                flex-1 h-12
                flex items-center justify-center
                bg-[#29292E]
                border-2 border-white/20
                rounded-xl
                text-xl text-white font-bold
                active:scale-95 transition
              "
            >
              <span className="text-2xl font-bold">
                {clicked ? "Generating..." : "Generate Voice"}
              </span>
            </button>

          </div>

          {/* Error message */}
          {error && (
            <p className="mt-2 text-red-400 text-sm">
              {error}
            </p>
          )}

          <AudioPlayer
            audio={audio}
            audioUrl={audioUrl}
            isGenerating={isGenerating}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            duration={duration}
          />
        </div>

        {/* Right side */}
        <div className="md:sticky md:top-6 md:self-start md:max-h-[calc(100vh-12rem)] md:overflow-y-auto md:pr-2 md:pt-1 md:pb-6 sm:mb-12 md:mb-12 lg:mb-0 custom-scrollbar">
          <div className="mb-3">
            <label className="block text-sm font-semibold text-gray-300 mb-1">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="
                w-full
                bg-[#29292E]
                border-2 border-white/20
                rounded-lg
                text-gray-200
                px-3 py-2
                focus:outline-none 
                cursor-pointer
              "
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          </div>


          <VoiceCard
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            speed={speed}
            setSpeed={setSpeed}
          />

          <SettingsPanel
            speed={speed}
            setSpeed={setSpeed}
          />


        </div>
      </div>
    </section>
  );
}
