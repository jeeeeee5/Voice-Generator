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
