import os
import uuid

import librosa
import soundfile as sf

from models.loader import tts
from models.voice_model import EMOTION_DSP
from inference.preprocess import build_speaker_refs
from utils.audio import apply_speed, apply_pitch, apply_emotion_gain, apply_expressiveness, clip_audio


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
    Generate speech by blending voice identity + style + emotion
    reference clips, then apply a light DSP pass driven by the
    speed/pitch/emotion_level/expressiveness sliders.

    Returns the path to the generated wav file.
    """
    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    speaker_refs, emotion_weight, voice_ref, style_ref, emotion_ref, speaking_style_ref = build_speaker_refs(
        voice, style, emotion, speaking_style, emotion_level
    )

    print(f"Blend -> voice:3, style:2 speaking_style:1, emotion:{emotion_weight} ")
    print("Voice:", voice, "->", voice_ref)
    print("Style:", style, "->", style_ref)
    print("Speaking Style:", speaking_style, "->", speaking_style_ref)
    print("Emotion:", emotion, "->", emotion_ref, "(included)" if emotion_level >= 15 else "(skipped, low intensity)")
    print("Reference blend:", speaker_refs)

    dsp = EMOTION_DSP.get(emotion, EMOTION_DSP["Neutral"])

    temp_path = f"outputs/generated_audio/temp_{uuid.uuid4().hex}.wav"

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

        final_speed = speed * dsp["speed"]
        audio = apply_speed(audio, sample_rate, final_speed)

        final_pitch = pitch + dsp["pitch"]
        audio = apply_pitch(audio, sample_rate, final_pitch)

        # emotion_level (0-100) controls how much the emotion clip's
        # designed gain contributes to the final output.
        audio = apply_emotion_gain(audio, dsp["gain"], emotion_level)
        audio = apply_expressiveness(audio, expressiveness)
        audio = clip_audio(audio)

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
        output_path="outputs/generated_audio/demo.wav",
        speed=1.0,
        pitch=0,
        emotion_level=70,
        expressiveness=60,
    )
    print("Generated:", result)
