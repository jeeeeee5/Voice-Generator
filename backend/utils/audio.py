import os
import uuid

import librosa
import numpy as np
import pyrubberband as pyrb
from models.loader import vc_tts

def apply_speed(audio, sample_rate, speed):
    if speed != 1.0:
        audio = pyrb.time_stretch(audio, sample_rate, rate=speed)
    return audio

def apply_pitch(audio, sample_rate, pitch):
    if pitch != 0:
        audio = pyrb.pitch_shift(
            audio, sample_rate, n_steps=pitch,
            rbargs={"--formant": ""}
        )
    return audio


def apply_emotion_gain(audio, base_gain, emotion_level, designed_level=50):
    """base_gain is the EMOTION_DSP preset's gain, designed around emotion_level=50."""
    intensity = emotion_level / designed_level
    gain = 1.0 + (base_gain - 1.0) * intensity
    return audio * gain


def apply_expressiveness(audio, expressiveness, designed_level=50):
    if expressiveness == designed_level:
        return audio
    factor = expressiveness / designed_level
    return audio * factor


def clip_audio(audio, threshold=0.95):
    over = np.abs(audio) > threshold
    if not np.any(over):
        return audio
    result = audio.copy()
    excess = np.abs(audio[over]) - threshold
    softened = threshold + (1 - threshold) * np.tanh(excess / (1 - threshold))
    result[over] = np.sign(audio[over]) * softened
    return result

def generate_silence(duration, sample_rate):
    """duration in seconds -> a mono array of zeros of matching length."""
    n_samples = max(0, int(duration * sample_rate))
    return np.zeros(n_samples, dtype=np.float32)


def load_sfx(name, sample_rate, voice_ref=None, pitch=0):
    """
    Load a bundled sound-effect clip (e.g. a sigh or a laugh) used for
    standalone expression tags like (Sigh) / (Laugh).

    Looks for backend/voices/sfx/<name>.wav. If it isn't there yet, falls
    back to a short silence so generation doesn't crash — record or source
    real sigh.wav / laugh.wav clips and drop them in voices/sfx/ to replace
    the placeholder.

    If voice_ref is given, the clip is passed through XTTS voice
    conversion so it matches the selected speaker's timbre instead of
    always sounding like whoever the sfx was originally recorded from.
    """
    sfx_path = f"voices/sfx/{name}.wav"

    if not os.path.exists(sfx_path):
        print(f"[warn] sfx clip missing: {sfx_path!r} -> using a short silence as a placeholder")
        return generate_silence(0.3, sample_rate)

    if voice_ref:
        converted_path = f"outputs/generated_audio/temp_sfx_{name}_{uuid.uuid4().hex}.wav"
        try:
            vc_tts.voice_conversion_to_file(
                source_wav=sfx_path,
                target_wav=voice_ref,
                file_path=converted_path,
            )
            clip, _ = librosa.load(converted_path, sr=sample_rate)
            clip = clip.astype(np.float32)
            if pitch != 0:
                clip = apply_pitch(clip, sample_rate, pitch)
            return clip.astype(np.float32)
        except Exception as e:
            print(f"[warn] voice conversion failed for sfx {name!r}: {e} -> using original clip")
        finally:
            if os.path.exists(converted_path):
                os.remove(converted_path)

    clip, _ = librosa.load(sfx_path, sr=sample_rate)
    return clip.astype(np.float32)

def concat_segments(chunks):
    """Concatenate a list of mono float32 audio arrays into one."""
    if not chunks:
        return np.array([], dtype=np.float32)
    return np.concatenate(chunks)
