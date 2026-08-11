from TTS.api import TTS

tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")

tts.tts_to_file(
    text="没关系，一切都会好起来的。",
    speaker_wav=["voices/identity/alice.wav"] * 4,
    language="zh-cn",
    file_path="test_new_voice_zh.wav",
)
