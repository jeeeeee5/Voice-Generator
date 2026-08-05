import { VolumeX, Volume1, Volume2, Play, Pause, Download, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import VoiceControls from "./VoiceControls";
import SpeechControls from "./SpeechControls";
import VoicePresets from "./VoicePresets";


export default function Main() {
  const [clicked, setClicked] = useState(false);
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audio, setAudio] = useState(null);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState("");
  const [showVolume, setShowVolume] = useState(false);
  const volumeRef = useRef(null);

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

  const defaultWaveform = [
    18, 25, 35, 18, 25, 35, 22,
    22, 45, 60, 38, 28, 52, 72,
    48, 35, 65, 80, 55, 42, 30, 50, 68, 45,
    18, 25, 35, 22,
    25, 38, 58, 75, 62, 40, 28, 48, 70, 55,
    35, 45, 65, 78, 60, 55, 40, 35, 18, 25, 35, 22,
    52, 38, 60, 72, 65, 40, 45,
  ];

  const [waveform, setWaveform] = useState(defaultWaveform);
  const [hasAudio, setHasAudio] = useState(false);

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        volumeRef.current &&
        !volumeRef.current.contains(event.target)
      ) {
        setShowVolume(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAudioUrl(null);
    setHasAudio(false);

    try {
      const response = await fetch("http://127.0.0.1:8000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          voice: selectedVoice,
          style: selectedVoiceStyle,
          speaking_style: selectedSpeakingStyle,
          speed: speed,
          pitch: pitch,
          emotion: selectedEmotion,
          emotion_level: emotionLevel,
          expressiveness: expressiveness,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate voice");
      }


      { /* Audio generation successful */ }
      const audioBlob = await response.blob();

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
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to generate voice. Please try again.");
    } finally {
      setClicked(false);
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
      <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 items-stretch">

        {/* Left side */}
        <div>

          {/* Input panel */}
          <div className="relative mb-4">
            <div className="absolute -inset-1 rounded-lg bg-purple-500/20 blur-xl pointer-events-none" />

            <div
              className="
                relative w-full h-72 md:h-[246px] bg-[#29292E]
                border-2 border-white rounded-xl p-5
              "
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to synthesize into voice..."
                className="
                  w-full h-full text-gray-200 text-lg bg-transparent
                  focus:ring-0 placeholder:text-gray-500
                  resize-none outline-none
                "
              />
            </div>
          </div>

          {/* Voice Controls */}
          <VoiceControls
            selectedVoice={selectedVoice}
            setSelectedVoice={setSelectedVoice}
            selectedVoiceStyle={selectedVoiceStyle}
            setSelectedVoiceStyle={setSelectedVoiceStyle}
            selectedEmotion={selectedEmotion}
            setSelectedEmotion={setSelectedEmotion}
            selectedSpeakingStyle={selectedSpeakingStyle}
            setSelectedSpeakingStyle={setSelectedSpeakingStyle}
          />

          {/* Voice Presets */}
          <VoicePresets
            selectedVoice={selectedVoice}
            selectedVoiceStyle={selectedVoiceStyle}
            selectedSpeakingStyle={selectedSpeakingStyle}
            selectedEmotion={selectedEmotion}
            emotionLevel={emotionLevel}
            speed={speed}
            pitch={pitch}
            expressiveness={expressiveness}

            setSelectedVoice={setSelectedVoice}
            setSelectedVoiceStyle={setSelectedVoiceStyle}
            setSelectedSpeakingStyle={setSelectedSpeakingStyle}
            setSelectedEmotion={setSelectedEmotion}
            setEmotionLevel={setEmotionLevel}
            setSpeed={setSpeed}
            setPitch={setPitch}
            setExpressiveness={setExpressiveness}
          />

          {/* Speech Controls */}
          <SpeechControls
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

          {/* Generate button */}
          <div className="relative mt-4">
            <div className="absolute -inset-1 rounded-xl bg-purple-500/20 blur-xl pointer-events-none" />

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

        </div>

        {/* Right side - Output panel */}
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
                    if (!audio) return;

                    if (isPlaying) {
                      audio.pause();
                      setIsPlaying(false);
                    } else {
                      audio.play();
                      setIsPlaying(true);
                    }
                  }}
                  disabled={!audio}
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
                      width: duration
                        ? `${(currentTime / duration) * 100}%`
                        : "0%",
                    }}
                  />

                  <div
                    className="
                      absolute top-1/2 -translate-y-1/2
                      w-3 h-3 bg-white rounded-full
                    "
                    style={{
                      left: duration
                        ? `${(currentTime / duration) * 100}%`
                        : "0%",
                    }}
                  />
                </div>

                {/* Time */}
                <span className="text-gray-400 text-sm whitespace-nowrap">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* Volume */}
                <div
                  ref={volumeRef}
                  className="relative flex items-center"
                >
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
                  onClick={() => {
                    if (!audioUrl) return;

                    const link = document.createElement("a");
                    link.href = audioUrl;
                    link.download = "speech.wav";
                    link.click();
                  }}
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
                  <Download
                    className="w-5 h-5 fill-white"
                    strokeWidth={1.75}
                  />
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
                onClick={() => {
                  if (!audioUrl) return;

                  const link = document.createElement("a");
                  link.href = audioUrl;
                  link.download = "speech.wav";
                  link.click();
                }}
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
                <Download
                  className="w-5 h-5 fill-white"
                  strokeWidth={1.75}
                />

                <span className="text-gray-300 text-lg font-semibold">
                  Download .WAV File
                </span>
              </button>

            </div>

          </div>
        </div>
          </div>

    </section>
  );
}