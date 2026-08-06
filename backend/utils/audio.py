import os

import librosa
import numpy as np


def apply_speed(audio, sample_rate, speed):
    if speed != 1.0:
        audio = librosa.effects.time_stretch(audio, rate=speed)
    return audio


def apply_pitch(audio, sample_rate, pitch):
    if pitch != 0:
        audio = librosa.effects.pitch_shift(audio, sr=sample_rate, n_steps=pitch)
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
    mean = np.mean(np.abs(audio)) + 1e-6
    return mean + (audio - mean) * factor


def clip_audio(audio):
    return np.clip(audio, -1.0, 1.0)


def generate_silence(duration, sample_rate):
    """duration in seconds -> a mono array of zeros of matching length."""
    n_samples = max(0, int(duration * sample_rate))
    return np.zeros(n_samples, dtype=np.float32)


def load_sfx(name, sample_rate):
    """
    Load a bundled sound-effect clip (e.g. a sigh or a laugh) used for
    standalone expression tags like (Sigh) / (Laugh).

    Looks for backend/voices/sfx/<name>.wav. If it isn't there yet, falls
    back to a short silence so generation doesn't crash — record or source
    real sigh.wav / laugh.wav clips and drop them in voices/sfx/ to replace
    the placeholder.
    """
    sfx_path = f"voices/sfx/{name}.wav"

    if os.path.exists(sfx_path):
        clip, _ = librosa.load(sfx_path, sr=sample_rate)
        return clip.astype(np.float32)

    print(f"[warn] sfx clip missing: {sfx_path!r} -> using a short silence as a placeholder")
    return generate_silence(0.3, sample_rate)


def concat_segments(chunks):
    """Concatenate a list of mono float32 audio arrays into one."""
    if not chunks:
        return np.array([], dtype=np.float32)
    return np.concatenate(chunks)
