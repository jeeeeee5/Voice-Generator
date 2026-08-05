import os
import uuid

import librosa
import numpy as np
import soundfile as sf
from TTS.api import TTS

MODEL_NAME = "tts_models/multilingual/multi-dataset/xtts_v2"

tts = TTS(model_name=MODEL_NAME)

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
    "Happy":   {"speed": 1.06, "pitch": 0, "gain": 1.05, "temperature": 0.75},
    "Sad":     {"speed": 0.92, "pitch": 0, "gain": 0.92, "temperature": 0.55},
    "Angry":   {"speed": 1.04, "pitch": 0, "gain": 1.10, "temperature": 0.80},
    "Fearful": {"speed": 1.02, "pitch": 0, "gain": 0.95, "temperature": 0.78},
    "Excited": {"speed": 1.12, "pitch": 0, "gain": 1.08, "temperature": 0.85},
}

SPEAKING_STYLE_MAP = {
    "Casual": "voices/speaking_style/casual.wav",
    "Professional": "voices/speaking_style/professional.wav",
    "Cinematic": "voices/speaking_style/cinematic.wav",
    "Game Character": "voices/speaking_style/game_character.wav",
}

DEFAULT_SPEAKING_STYLE_REF = "voices/speaking_style/casual.wav"


def _resolve_ref(path: str, fallback: str) -> str:
    """Return path if it exists on disk, otherwise fall back safely."""
    if path and os.path.exists(path):
        return path
    print(f"[warn] reference clip missing: {path!r} -> falling back to {fallback!r}")
    return fallback


def _check_all_refs():
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


_check_all_refs()


def generate_speech(
    text: str,
    voice: str,
    style: str,
    emotion: str = "Neutral",
    speaking_style: str = "Casual",
    output_path: str = "output/result.wav",
    speed: float = 1.0,
    pitch: float = 0,
    emotion_level: int = 50,
    expressiveness: int = 50,
    language: str = "en",
) -> str:
    """
    Generate speech by blending voice identity + style + emotion
    reference clips, then apply a light DSP pass driven by the
    speed/pitch/emotion_level/expressiveness sliders.

    Returns the path to the generated wav file.
    """
    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    os.makedirs("output", exist_ok=True)

    voice_ref = _resolve_ref(VOICE_IDENTITY_MAP.get(voice, ""), DEFAULT_VOICE_REF)
    style_ref = _resolve_ref(VOICE_STYLE_MAP.get(style, ""), DEFAULT_STYLE_REF)
    emotion_ref = _resolve_ref(EMOTION_AUDIO_MAP.get(emotion, ""), DEFAULT_EMOTION_REF)
    speaking_style_ref = _resolve_ref(
        SPEAKING_STYLE_MAP.get(speaking_style, ""),
        DEFAULT_SPEAKING_STYLE_REF
    )

    # emotion_level (0-100) controls how much the emotion clip
    # contributes to the blend. Below ~15 we skip it entirely and
    # let voice+style carry the delivery (i.e. "barely any emotion").
    # Voice identity has the highest priority.
    speaker_refs = [
        voice_ref,
        voice_ref,
        voice_ref,
        style_ref,
        style_ref,
        speaking_style_ref,
    ]

    # Emotion influence increases with emotion level.
    if emotion_level >= 15:
        if emotion_level < 50:
            emotion_weight = 1
        elif emotion_level < 80:
            emotion_weight = 2
        else:
            emotion_weight = 3

        speaker_refs.extend([emotion_ref] * emotion_weight)
    else:
        emotion_weight = 0

    print(
        f"Blend -> voice:3, style:2 "
        f"speaking_style:1, emotion:{emotion_weight} "
    )

    print("Voice:", voice, "->", voice_ref)
    print("Style:", style, "->", style_ref)
    print("Speaking Style:", speaking_style, "->", speaking_style_ref)
    print("Emotion:", emotion, "->", emotion_ref, "(included)" if emotion_level >= 15 else "(skipped, low intensity)")
    print("Reference blend:", speaker_refs)

    dsp = EMOTION_DSP.get(emotion, EMOTION_DSP["Neutral"])

    temp_path = f"output/temp_{uuid.uuid4().hex}.wav"

    try:
        tts.tts_to_file(
            text=text,
            speaker_wav=speaker_refs,  # list -> XTTS blends the embeddings
            language=language,
            speed=1.0,  # raw model speed left neutral; we apply speed below
            temperature=dsp["temperature"],
            file_path=temp_path,
        )

        audio, sample_rate = librosa.load(temp_path, sr=None)

        # --- speed ---
        final_speed = speed * dsp["speed"]
        if final_speed != 1.0:
            audio = librosa.effects.time_stretch(audio, rate=final_speed)

        # --- pitch ---
        final_pitch = pitch + dsp["pitch"]
        if final_pitch != 0:
            audio = librosa.effects.pitch_shift(audio, sr=sample_rate, n_steps=final_pitch)

        # --- emotion intensity ---
        intensity = emotion_level / 50  # 50 = the DSP preset's "designed" strength
        gain = 1.0 + (dsp["gain"] - 1.0) * intensity
        audio = audio * gain

        # --- expressiveness ---
        if expressiveness != 50:
            factor = expressiveness / 50  # 0-2 range
            mean = np.mean(np.abs(audio)) + 1e-6
            audio = mean + (audio - mean) * factor

        audio = np.clip(audio, -1.0, 1.0)

        sf.write(output_path, audio, sample_rate)
        return output_path

    except Exception as e:
            print(f"[XTTS Error] Voice generation failed: {e}")
            raise

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    # quick manual smoke test
    result = generate_speech(
        text="Welcome to our world.",
        voice="Sarah",
        style="Storytelling",
        speaking_style="Casual",
        emotion="Happy",
        output_path="output/demo.wav",
        speed=1.0,
        pitch=0,
        emotion_level=70,
        expressiveness=60,
    )
    print("Generated:", result)
