from TTS.api import TTS

tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")

tts.tts_to_file(
    text="Please don't tell anyone.",
    speaker_wav=["voices/identity/evelyn.wav", "voices/emotion/whisper.wav", "voices/emotion/whisper.wav"],
    language="en",
    file_path="test_whisper_recheck.wav",
    repetition_penalty=2.0,
    length_penalty=1.0,
    top_p=0.85,
    top_k=50,
)