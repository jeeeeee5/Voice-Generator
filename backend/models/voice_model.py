import os

# ---------------------------------------------------------------------------
# Reference audio maps
# ---------------------------------------------------------------------------

VOICE_IDENTITY_MAP = {
    "John": "voices/identity/john.wav",
    "Michael": "voices/identity/michael.wav",
    "David": "voices/identity/david.wav",
    "James": "voices/identity/james.wav",
    "William": "voices/identity/william.wav",
    "Emma": "voices/identity/emma.wav",
    "Sarah": "voices/identity/sarah.wav",
    "Olivia": "voices/identity/olivia.wav",
    "Sophia": "voices/identity/sophia.wav",
    "Grace": "voices/identity/grace.wav",
}

# Fallback used whenever a requested voice name isn't in the map above
DEFAULT_VOICE_REF = "voices/identity/john.wav"

VOICE_STYLE_MAP = {
    "Warm": "voices/style/warm.wav",
    "Calm": "voices/style/calm.wav",
    "Deep": "voices/style/deep.wav",
    "Bright": "voices/style/bright.wav",
    "Emotional": "voices/style/emotional.wav",
    "Serious": "voices/style/serious.wav",
    "Narrator": "voices/style/narrator.wav",
    "Storytelling": "voices/style/storytelling.wav",
}
DEFAULT_STYLE_REF = "voices/style/narrator.wav"

EMOTION_AUDIO_MAP = {
    "Neutral": "voices/emotion/neutral.wav",
    "Happy": "voices/emotion/happy.wav",
    "Sad": "voices/emotion/sad.wav",
    "Angry": "voices/emotion/angry.wav",
    "Fearful": "voices/emotion/fearful.wav",
    "Excited": "voices/emotion/excited.wav",
}
DEFAULT_EMOTION_REF = "voices/emotion/neutral.wav"

EMOTION_DSP = {
    "Neutral": {"speed": 1.00, "pitch": 0, "gain": 1.00, "temperature": 0.65},
    "Happy":   {"speed": 1.03, "pitch": +1, "gain": 1.05, "temperature": 0.75},
    "Sad":     {"speed": 0.96, "pitch": -1, "gain": 0.92, "temperature": 0.55},
    "Angry":   {"speed": 1.04, "pitch": -1, "gain": 1.10, "temperature": 0.80},
    "Fearful": {"speed": 1.02, "pitch": +1, "gain": 0.95, "temperature": 0.78},
    "Excited": {"speed": 1.05, "pitch": +1, "gain": 1.08, "temperature": 0.85},
}

SPEAKING_STYLE_MAP = {
    "Casual": "voices/speaking_style/casual.wav",
    "Professional": "voices/speaking_style/professional.wav",
    "Cinematic": "voices/speaking_style/cinematic.wav",
    "Game Character": "voices/speaking_style/game_character.wav",
}

DEFAULT_SPEAKING_STYLE_REF = "voices/speaking_style/casual.wav"


def resolve_ref(path: str, fallback: str) -> str:
    """Return path if it exists on disk, otherwise fall back safely."""
    if path and os.path.exists(path):
        return path
    print(f"[warn] reference clip missing: {path!r} -> falling back to {fallback!r}")
    return fallback


def check_all_refs():
    """Startup sanity check so missing files fail loudly, not silently."""
    for group_name, mapping in (
        ("voice identity", VOICE_IDENTITY_MAP),
        ("style", VOICE_STYLE_MAP),
        ("emotion", EMOTION_AUDIO_MAP),
        ("speaking style", SPEAKING_STYLE_MAP),
    ):
        for name, path in mapping.items():
            status = "OK" if os.path.exists(path) else "MISSING"
            print(f"[{group_name}] {name} -> {path} ({status})")


# Run the same startup sanity check the original tts_engine.py ran at import time
check_all_refs()
