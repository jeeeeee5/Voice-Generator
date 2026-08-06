from models.voice_model import (
    VOICE_IDENTITY_MAP, DEFAULT_VOICE_REF,
    VOICE_STYLE_MAP, DEFAULT_STYLE_REF,
    EMOTION_AUDIO_MAP, DEFAULT_EMOTION_REF,
    SPEAKING_STYLE_MAP, DEFAULT_SPEAKING_STYLE_REF,
    resolve_ref,
)


def build_speaker_refs(voice: str, style: str, emotion: str, speaking_style: str, emotion_level: int):
    """
    Resolve reference clips and build the blended speaker_wav list.
    """

    voice_ref = resolve_ref(
        VOICE_IDENTITY_MAP.get(voice, ""),
        DEFAULT_VOICE_REF
    )

    # Style: None = no style reference
    style_ref = None
    if style != "None":
        style_ref = resolve_ref(
            VOICE_STYLE_MAP.get(style, ""),
            DEFAULT_STYLE_REF
        )

    # Emotion: Neutral = no emotion reference
    emotion_ref = None
    if emotion != "Neutral":
        emotion_ref = resolve_ref(
            EMOTION_AUDIO_MAP.get(emotion, ""),
            DEFAULT_EMOTION_REF
        )

    # Speaking Style: None = no speaking style reference
    speaking_style_ref = None
    if speaking_style != "None":
        speaking_style_ref = resolve_ref(
            SPEAKING_STYLE_MAP.get(speaking_style, ""),
            DEFAULT_SPEAKING_STYLE_REF
        )

    # Voice identity has the highest priority
    speaker_refs = [
        voice_ref,
        voice_ref,
        voice_ref,
    ]

    # Add style only when selected
    if style_ref:
        speaker_refs.extend([
            style_ref,
            style_ref,
        ])

    # Add speaking style only when selected
    if speaking_style_ref:
        speaker_refs.append(speaking_style_ref)

    # Add emotion according to emotion level
    if emotion_ref and emotion_level >= 15:
        if emotion_level < 50:
            emotion_weight = 1
        elif emotion_level < 80:
            emotion_weight = 2
        else:
            emotion_weight = 3

        speaker_refs.extend([emotion_ref] * emotion_weight)
    else:
        emotion_weight = 0

    return (
        speaker_refs,
        emotion_weight,
        voice_ref,
        style_ref,
        emotion_ref,
        speaking_style_ref
    )