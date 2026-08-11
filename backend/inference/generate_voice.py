import os
import uuid

import librosa
import soundfile as sf

from models.loader import tts
from models.voice_model import EMOTION_DSP, VOICE_DSP
from inference.preprocess import build_speaker_refs, normalize_chinese
from inference.tag_parser import parse_tagged_text
from utils.audio import (
    apply_pitch,
    apply_emotion_gain,
    apply_expressiveness,
    clip_audio,
    generate_silence,
    load_sfx,
    concat_segments,
)

CHINESE_LANGUAGE_CODES = {"zh", "zh-cn", "zh-tw", "zh-hans", "zh-hant"}

def detect_language(text: str) -> str:
    return "zh-cn" if any("\u4e00" <= ch <= "\u9fff" for ch in text) else "en"

def generate_speech(
    text: str,
    voice: str,
    style: str,
    emotion: str = "Neutral",
    speaking_style: str = "Casual",
    output_path: str = "outputs/generated_audio/result.wav",
    speed: float = 1.0,
    pitch: float = 0,
    emotion_level: int = 50,
    expressiveness: int = 50,
    language: str = "en",
) -> str:
    """
    Generate speech from text that may contain (Emotion) tags and pause
    markers (see inference/tag_parser.py — (Nervous), (Sigh), "...", ",",
    "[Pause]" etc). Plain text with no tags behaves the same as before,
    using `emotion` as a flat setting for the whole line.

    Tagged text is split into segments by parse_tagged_text(): each speech
    segment is generated separately with its own emotion's DSP settings,
    pause markers become explicit silence, and (Sigh)/(Laugh) become
    standalone sfx clips. Everything is stitched back into one wav file.

    Note: a multi-segment line calls the TTS model once per segment, so
    generation time scales with how many tags/pauses are in the text —
    this is slower than the old single-shot approach.

    Returns the path to the generated wav file.
    """
    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    if language.lower() in CHINESE_LANGUAGE_CODES:
        language = "zh-cn"

    segments = parse_tagged_text(text, default_emotion=emotion)

    if not segments:
        raise ValueError("No speech content found in the input text.")

    # Resolve just the voice identity reference up front — sfx segments
    # (Laugh/Sigh) need it for voice conversion, and it doesn't depend on
    # emotion, so there's no need to wait for a speech segment to get it.
    _, _, voice_ref, _, _, _ = build_speaker_refs(
        voice, style, "Neutral", speaking_style, 0
    )

    sample_rate = None
    audio_chunks = []  # list of ("speech", ndarray) | ("pause", seconds) | ("sfx", name)
    temp_files = []

    try:
        for seg in segments:
            if seg["type"] == "pause":
                audio_chunks.append(("pause", seg["duration"]))
                continue

            if seg["type"] == "sfx":
                audio_chunks.append(("sfx", seg["sfx"]))
                continue

            # seg["type"] == "speech"
            seg_emotion = seg["emotion"] if seg["emotion"] in EMOTION_DSP else "Neutral"
            dsp = EMOTION_DSP[seg_emotion]

            speaker_refs, emotion_weight, voice_ref, style_ref, emotion_ref, speaking_style_ref = build_speaker_refs(
                voice, style, seg_emotion, speaking_style, emotion_level
            )

            seg_text = seg["text"]
            if language == "zh-cn":
                seg_text = normalize_chinese(seg_text)

            print(f"[segment] emotion={seg_emotion!r} text={seg_text!r}")

            # Elder voice refinement
            voice_dsp = VOICE_DSP.get(voice)
            if seg_emotion == "Whisper":
                voice_dsp = None   # Whisper's breathy quality is too fragile to survive
                                    # additional pitch/gain layering — keep it on the
                                    # emotion-only DSP path, skip the voice-level tweak.

            final_speed = speed * dsp["speed"]

            if voice_dsp:
                final_speed *= voice_dsp["speed"]

            temp_path = f"outputs/generated_audio/temp_{uuid.uuid4().hex}.wav"
            temp_files.append(temp_path)

            # The repetition/length penalty tuning below was calibrated to fix
            # repeated phrases in emotions like Scared, but it actively suppresses
            # the breathy/noisy quality Whisper needs — so Whisper uses closer-to-
            # default sampling params instead of the global tuned values.
            if seg_emotion == "Whisper":
                tts.tts_to_file(
                    text=seg_text,
                    speaker_wav=speaker_refs,
                    language=language,
                    speed=final_speed,
                    temperature=dsp["temperature"],
                    repetition_penalty=2.0,
                    length_penalty=1.0,
                    top_p=0.85,
                    top_k=50,
                    file_path=temp_path,
                )
            else:
                tts.tts_to_file(
                    text=seg_text,
                    speaker_wav=speaker_refs,
                    language=language,
                    speed=final_speed,
                    temperature=dsp["temperature"],
                    repetition_penalty=6.0,
                    length_penalty=1.3,
                    top_p=0.85,
                    top_k=50,
                    enable_text_splitting=True,
                    file_path=temp_path,
                )

            seg_audio, sr = librosa.load(temp_path, sr=None)
            if sample_rate is None:
                sample_rate = sr

            final_pitch = pitch + dsp["pitch"]

            if voice_dsp:
                final_pitch += voice_dsp["pitch"]
            seg_audio = apply_pitch(seg_audio, sr, final_pitch)

            final_gain = dsp["gain"]
            if voice_dsp:
                final_gain *= voice_dsp["gain"]

            seg_audio = apply_emotion_gain(seg_audio, final_gain, emotion_level)

            # Boost expressiveness for exclamation marks without changing emotion
            segment_expressiveness = expressiveness
            if seg.get("intensity") == "strong":
                segment_expressiveness = min(100, expressiveness + 20)

            seg_audio = apply_expressiveness(seg_audio, segment_expressiveness)
            seg_audio = clip_audio(seg_audio)

            audio_chunks.append(("speech", seg_audio))

        if sample_rate is None:
            raise ValueError(
                "Could not determine a sample rate — the input text produced "
                "no speech segments (only pauses/sfx)."
            )

        # Pause/sfx chunks were queued before we knew the model's sample
        # rate, so resolve them into real audio now.
        resolved_chunks = []
        for kind, payload in audio_chunks:
            if kind == "speech":
                resolved_chunks.append(payload)
            elif kind == "pause":
                resolved_chunks.append(generate_silence(payload, sample_rate))
            elif kind == "sfx":
                sfx_dsp = EMOTION_DSP.get(payload.title(), EMOTION_DSP["Neutral"])
                resolved_chunks.append(
                    load_sfx(payload, sample_rate, voice_ref=voice_ref, pitch=pitch + sfx_dsp["pitch"])
                )
        final_audio = concat_segments(resolved_chunks)
        sf.write(output_path, final_audio, sample_rate)
        return output_path

    except Exception as e:
        print(f"[XTTS Error] Voice generation failed: {e}")
        raise

    finally:
        for path in temp_files:
            if os.path.exists(path):
                os.remove(path)


if __name__ == "__main__":
    result = generate_speech(
        text="(Calm) Everything is going to be fine.",
        voice="<NewVoice>",
        style="Warm",
        speaking_style="Casual",
        emotion="Neutral",
        output_path="outputs/generated_audio/demo_new_voice.wav",
        speed=1.0,
        pitch=0,
        emotion_level=70,
        expressiveness=50,
    )
    print("Generated:", result)
