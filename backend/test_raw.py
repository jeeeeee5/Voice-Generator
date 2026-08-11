from TTS.api import TTS

tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2")

texts = {
    "short": "That's amazing.",
    "medium": "That's amazing, I really can't believe you did this for me.",
    "long": "That's amazing, I really can't believe you actually did this for me, it means more than you know and I'll never forget it.",
}

for label, text in texts.items():
    for i in range(5):
        tts.tts_to_file(
            text=text,
            speaker_wav=["voices/identity/sarah.wav"]*4 + ["voices/style/warm.wav"] + ["voices/emotion/happy.wav"]*2,
            language="en",
            repetition_penalty=6.0,
            length_penalty=1.3,
            top_p=0.85,
            top_k=50,
            file_path=f"test_len_{label}_run{i}.wav",
        )