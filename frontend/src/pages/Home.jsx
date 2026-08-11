import { useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import PromptBox from "../components/PromptBox";
import TagHelper from "../components/TagHelper";
import VoiceCard from "../components/VoiceCard";
import SettingsPanel from "../components/SettingsPanel";
import AudioPlayer from "../components/AudioPlayer";
import { generateVoice as requestVoice } from "../services/api";

const defaultWaveform = [
  18, 25, 35, 18, 25, 35, 22,
  22, 45, 60, 38, 28, 52, 72,
  48, 35, 65, 80, 55, 42, 30, 50, 68, 45,
  18, 25, 35, 22,
  25, 38, 58, 75, 62, 40, 28, 48, 70, 55,
  35, 45, 65, 78, 60, 55, 40, 35, 18, 25, 35, 22,
  52, 38, 60, 72, 65, 40, 45,
];

export default function Home() {
  const textareaRef = useRef(null);
  const [clicked, setClicked] = useState(false);
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audio, setAudio] = useState(null);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  { /* State for voice options */ }
  const [selectedVoice, setSelectedVoice] = useState("Michael");
  const [selectedVoiceStyle, setSelectedVoiceStyle] = useState("Warm");
  const [selectedEmotion, setSelectedEmotion] = useState("Neutral");
  const [selectedSpeakingStyle, setSelectedSpeakingStyle] = useState("Casual");

  { /* State for speech controls */ }
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [emotionLevel, setEmotionLevel] = useState(50);
  const [expressiveness, setExpressiveness] = useState(50);

  const [language, setLanguage] = useState("en"); // "en" | "zh"

  const [waveform, setWaveform] = useState(defaultWaveform);
  const [hasAudio, setHasAudio] = useState(false);

  const removeOutput = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudio(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasAudio(false);
    setWaveform(defaultWaveform);
  };

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
    setHasAudio(false);
    setWaveform(defaultWaveform);

    try {
      const audioBlob = await requestVoice({
        text: text,
        voice: selectedVoice,
        style: selectedVoiceStyle,
        speaking_style: selectedSpeakingStyle,
        speed: speed,
        pitch: pitch,
        emotion: selectedEmotion,
        emotion_level: emotionLevel,
        expressiveness: expressiveness,
        language: language === "zh" ? "zh-cn" : "en",
      });

      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setHasAudio(true);

      const newAudio = new Audio(url);
      newAudio.volume = volume;

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

      const arrayBuffer = await audioBlob.arrayBuffer();

      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const channelData = audioBuffer.getChannelData(0);

      const bars = 60;
      const samplesPerBar = Math.floor(channelData.length / bars);

      const waveformData = [];

      for (let i = 0; i < bars; i++) {
        let sum = 0;

        const start = i * samplesPerBar;
        const end = start + samplesPerBar;

        for (let j = start; j < end; j++) {
          sum += Math.abs(channelData[j]);
        }

        const average = sum / samplesPerBar;

        waveformData.push(Math.max(10, average * 100));
      }

      setWaveform(waveformData);

      await audioContext.close();

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
    <section className=" pt-28 px-6 md:px-28 xl:px-32">
      {/* Heading */}
      <h1 className="text-4xl font-bold mb-3">
        AI Text-to-Voice Generator
      </h1>

      <p className="text-indigo-300/80 text-2xl mb-5">
        Local Inference Engine
      </p>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 mb-6">
        {/* Left side */}
        <div>
          <PromptBox ref={textareaRef} text={text} setText={setText} language={language} />

          {/* Generate button */}
          <div className="relative mt-4">
            <div className="absolute -inset-px rounded-xl bg-purple-500/20 blur-sm pointer-events-none" />

            <button
              onClick={generateVoice}
              disabled={clicked || !text.trim()}
              className="
                relative group w-full h-16
                flex items-center justify-center gap-2
                bg-[#000042]
                border-2 border-blue-500
                rounded-xl
                text-xl text-white font-bold
                active:scale-95 transition
                mb-6
              "
            >
              <Volume2 className="w-6 h-6 fill-white" />

              <span className="text-2xl font-bold">
                {clicked ? "Generating..." : "Generate Voice"}
              </span>
            </button>

            {/* Error message */}
            {error && (
              <p className="mt-2 text-red-400 text-sm">
                {error}
              </p>
            )}
          </div>

          <AudioPlayer
            audio={audio}
            audioUrl={audioUrl}
            hasAudio={hasAudio}
            isGenerating={isGenerating}
            waveform={waveform}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            currentTime={currentTime}
            setCurrentTime={setCurrentTime}
            duration={duration}
            volume={volume}
            setVolume={setVolume}
            removeOutput={removeOutput}
          />
        </div>

        {/* Right side */}
        <div className="md:sticky md:top-6 md:max-h-[calc(100vh-3rem)] md:overflow-y-auto md:pr-2 custom-scrollbar">
          <div className="flex gap-2 mb-3 h-6">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 text-xs rounded-full border transition ${
                language === "en"
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-[#29292E] border-white/20 text-gray-300"
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage("zh")}
              className={`px-3 py-1 text-xs rounded-full border transition ${
                language === "zh"
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-[#29292E] border-white/20 text-gray-300"
              }`}
            >
              中文
            </button>
          </div>

          <TagHelper
            text={text}
            setText={setText}
            textareaRef={textareaRef}
            defaultEmotion={selectedEmotion}
            language={language}
          />

          <VoiceCard
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            selectedVoiceStyle={selectedVoiceStyle}
            setSelectedVoiceStyle={setSelectedVoiceStyle}
            selectedEmotion={selectedEmotion}
            setSelectedEmotion={setSelectedEmotion}
            selectedSpeakingStyle={selectedSpeakingStyle}
            setSelectedSpeakingStyle={setSelectedSpeakingStyle}
            emotionLevel={emotionLevel}
            setEmotionLevel={setEmotionLevel}
            speed={speed}
            setSpeed={setSpeed}
            pitch={pitch}
            setPitch={setPitch}
            expressiveness={expressiveness}
            setExpressiveness={setExpressiveness}
          />

          <SettingsPanel
            speed={speed}
            setSpeed={setSpeed}
            pitch={pitch}
            setPitch={setPitch}
            volume={volume}
            setVolume={setVolume}
            emotionLevel={emotionLevel}
            setEmotionLevel={setEmotionLevel}
            expressiveness={expressiveness}
            setExpressiveness={setExpressiveness}
          />


        </div>
      </div>
    </section>
  );
}
