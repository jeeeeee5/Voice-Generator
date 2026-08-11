from models.voice_model import (
    VOICE_IDENTITY_MAP, DEFAULT_VOICE_REF,
    VOICE_STYLE_MAP, DEFAULT_STYLE_REF,
    EMOTION_AUDIO_MAP, DEFAULT_EMOTION_REF,
    SPEAKING_STYLE_MAP, DEFAULT_SPEAKING_STYLE_REF,
    resolve_ref,
)

from opencc import OpenCC

_T2S_CONVERTER = OpenCC("t2s")

def normalize_chinese(text: str) -> str:
    return _T2S_CONVERTER.convert(text)

# These emotions have reference clips with vocal characteristics
# (pitch/timbre) that can pull the output away from the target voice.
# Skip emotion-reference blending for these emotions and rely on
# EMOTION_DSP to preserve emotion while maintaining voice identity.
#
# Confirmed through isolated testing:
# Sad, Crying, Disappointed, Serious, Sigh, and Nervous.
NO_BLEND_EMOTIONS = {"Sad", "Disappointed", "Serious", "Sigh", "Nervous"}

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

    # Voice identity has the highest priority. Repeated 4x — validated via
    # isolated testing (voice_ref x3 + style/speaking_style refs made the
    # output sound like a different person; voice_ref x4-5 alone gave the
    # best identity consistency + audio quality tradeoff).
    #
    # Whisper is an exception: its breathy quality gets diluted by any
    # normal-voiced reference, so it uses fewer voice_ref copies to keep
    # the whisper reference dominant in the mix (see emotion_weight below).
    if emotion == "Whisper":
        speaker_refs = [voice_ref]
    else:
        speaker_refs = [
            voice_ref,
            voice_ref,
            voice_ref,
            voice_ref,
        ]

    # Add style only when selected — but skip for Whisper, since its
    # breathy/airy quality is easily diluted by normal-voiced references
    # and needs to stay dominant in the mix. Only 1 copy — testing showed
    # 2x copies pulled the voice noticeably away from the identity
    # reference; 1x keeps the style influence audible while staying
    # close to the voice_ref-only baseline.
    if style_ref and emotion != "Whisper":
        speaker_refs.append(style_ref)

    # NOTE: speaking_style_ref is intentionally NOT blended into
    # speaker_refs. Isolated testing (t5 vs t6) showed voice_ref alone
    # gave better identity consistency than including it, and dropping
    # it didn't cost audio quality. speaking_style_ref is still resolved
    # above (returned for potential future use) but no longer
    # contributes to the TTS voice blend.

    # Add emotion according to emotion level
    if emotion in NO_BLEND_EMOTIONS:
        # Confirmed via isolated testing (test_raw.py, EN + ZH) that even a
        # single copy of these emotions' reference audio pulls the output
        # away from the voice identity — skip blending entirely and rely
        # on EMOTION_DSP (speed/pitch/gain) instead.
        emotion_ref = None
        emotion_weight = 0
    elif emotion_ref and emotion_level >= 15:
        if emotion == "Whisper":
            emotion_weight = 2
        elif emotion_level < 50:
            emotion_weight = 1
        elif emotion_level < 80:
            emotion_weight = 2
        else:
            emotion_weight = 2

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