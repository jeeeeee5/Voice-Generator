import VoiceCard from "./VoiceCard";
import SettingsPanel from "./SettingsPanel";

export default function SidePanel({
  selectedVoice,
  setSelectedVoice,
  speed,
  setSpeed,
}) {
  return (
    <>
      <VoiceCard
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
      />

      <SettingsPanel
        speed={speed}
        setSpeed={setSpeed}
      />
    </>
  );
}