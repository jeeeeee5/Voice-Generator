from TTS.api import TTS

MODEL_NAME = "tts_models/multilingual/multi-dataset/xtts_v2"
VC_MODEL_NAME = "voice_conversion_models/multilingual/vctk/freevc24"

# Loaded once at import time (same behaviour as the original tts_engine.py)
tts = TTS(model_name=MODEL_NAME)

# Separate model dedicated to voice conversion (used for re-voicing sfx
# clips like laugh/sigh to match the selected speaker). xtts_v2 itself
# does NOT carry voice conversion capability — tts.voice_converter is
# None unless a VC-specific model is loaded separately.
vc_tts = TTS(model_name=VC_MODEL_NAME)