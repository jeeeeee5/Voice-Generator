from TTS.api import TTS

MODEL_NAME = "tts_models/multilingual/multi-dataset/xtts_v2"

# Loaded once at import time (same behaviour as the original tts_engine.py)
tts = TTS(model_name=MODEL_NAME)
