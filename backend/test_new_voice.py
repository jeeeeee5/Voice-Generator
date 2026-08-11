from TTS.api import TTS
tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")

for i in range(3):
    tts.tts_to_file(
        text="This is a simple test sentence.",
        speaker_wav=["voices/identity/alice.wav"] * 4,
        language="en",
        file_path=f"test_new_voice_run{i}.wav",
    )