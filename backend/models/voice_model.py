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
    "Alice": "voices/identity/alice.wav",
    "Evelyn": "voices/identity/evelyn.wav"
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

# NOTE: "Scared" replaces the old "Fearful" naming to match the emotion-tag
# spec. If any saved presets/UI code still reference "Fearful", update them
# to "Scared" too.
EMOTION_AUDIO_MAP = {
    "Neutral": "voices/emotion/neutral.wav",
    "Happy": "voices/emotion/happy.wav",
    "Sad": "voices/emotion/sad.wav",
    "Angry": "voices/emotion/angry.wav",
    "Nervous": "voices/emotion/nervous.wav",
    "Scared": "voices/emotion/scared.wav",
    "Whisper": "voices/emotion/whisper.wav",
    "Excited": "voices/emotion/excited.wav",
    "Laugh": "voices/emotion/laugh.wav",
    "Sigh": "voices/emotion/sigh.wav",
    "Crying": "voices/emotion/crying.wav",
    "Serious": "voices/emotion/serious.wav",
    "Calm": "voices/emotion/calm.wav",
    "Confident": "voices/emotion/confident.wav",
    "Surprised": "voices/emotion/surprised.wav",
    "Disappointed": "voices/emotion/disappointed.wav",
}
DEFAULT_EMOTION_REF = "voices/emotion/neutral.wav"

# DSP parameters per emotion tag.
#   speed       multiplier applied on top of the user's speed slider
#   pitch       semitone offset added on top of the user's pitch slider
#   gain        volume multiplier (scaled by emotion_level, see utils/audio.py)
#   temperature XTTS sampling temperature — higher = more expressive/variable,
#               lower = flatter and more monotone
#
# These are starting points based on the "Emotion Effects" spec
# (shaky/slower for Nervous, lower+slower for Sad, stronger/higher-intensity
# for Angry, higher-energy/faster for Happy, breathy/quieter for
# Sigh/Whisper, etc). Tune by ear against real generations.
EMOTION_DSP = {
    "Neutral":      {"speed": 1.00, "pitch": 0,  "gain": 1.00, "temperature": 0.65},
    "Happy":        {"speed": 1.02, "pitch": 0,  "gain": 1.02, "temperature": 0.75},
    "Sad":          {"speed": 0.95, "pitch": -0.3, "gain": 0.92, "temperature": 0.55},
    "Angry":        {"speed": 1.02, "pitch": 0,  "gain": 1.06, "temperature": 0.85},
    "Nervous":      {"speed": 1.02, "pitch": 0,  "gain": 0.97, "temperature": 0.85},
    "Scared":       {"speed": 1.02, "pitch": 0,  "gain": 0.97, "temperature": 0.80},
    "Whisper":      {"speed": 0.97, "pitch": 0,  "gain": 0.70, "temperature": 0.78},
    "Excited":      {"speed": 1.04, "pitch": 0,  "gain": 1.05, "temperature": 0.85},
    "Laugh":        {"speed": 1.02, "pitch": 0,  "gain": 1.02, "temperature": 0.75},
    "Sigh":         {"speed": 0.97, "pitch": 0,  "gain": 0.92, "temperature": 0.60},
    "Crying":       {"speed": 0.93, "pitch": -0.3,  "gain": 0.90, "temperature": 0.75},
    "Serious":      {"speed": 0.99, "pitch": -0.2,  "gain": 1.00, "temperature": 0.55},
    "Calm":         {"speed": 0.97, "pitch": 0,  "gain": 0.97, "temperature": 0.55},
    "Confident":    {"speed": 1.00, "pitch": 0,  "gain": 1.02, "temperature": 0.65},
    "Surprised":    {"speed": 1.04, "pitch": 0,  "gain": 1.02, "temperature": 0.80},
    "Disappointed": {"speed": 0.95, "pitch": -0.3,  "gain": 0.9, "temperature": 0.60},
}

VOICE_DSP = {
    "Evelyn": {
        "speed": 0.80,
        "pitch": -0.5,
        "gain": 0.94,
    },
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
