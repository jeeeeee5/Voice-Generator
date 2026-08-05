from models.voice_model import (
    VOICE_IDENTITY_MAP, DEFAULT_VOICE_REF,
    VOICE_STYLE_MAP, DEFAULT_STYLE_REF,
    EMOTION_AUDIO_MAP, DEFAULT_EMOTION_REF,
    SPEAKING_STYLE_MAP, DEFAULT_SPEAKING_STYLE_REF,
    resolve_ref,
)


def build_speaker_refs(voice: str, style: str, emotion: str, speaking_style: str, emotion_level: int):
    """
    Resolve individual reference clips and build the blended speaker_wav
    list used by XTTS. Emotion influence scales with emotion_level:
    below 15 the emotion clip is skipped entirely, otherwise it's added
    1-3 times depending on how strong emotion_level is.

    Returns (speaker_refs, emotion_weight, voice_ref, style_ref, emotion_ref, speaking_style_ref).
    """
    voice_ref = resolve_ref(VOICE_IDENTITY_MAP.get(voice, ""), DEFAULT_VOICE_REF)
    style_ref = resolve_ref(VOICE_STYLE_MAP.get(style, ""), DEFAULT_STYLE_REF)
    emotion_ref = resolve_ref(EMOTION_AUDIO_MAP.get(emotion, ""), DEFAULT_EMOTION_REF)
    speaking_style_ref = resolve_ref(
        SPEAKING_STYLE_MAP.get(speaking_style, ""),
        DEFAULT_SPEAKING_STYLE_REF
    )

    # Voice identity has the highest priority in the blend.
    speaker_refs = [
        voice_ref,
        voice_ref,
        voice_ref,
        style_ref,
        style_ref,
        speaking_style_ref,
    ]

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

    return speaker_refs, emotion_weight, voice_ref, style_ref, emotion_ref, speaking_style_ref
