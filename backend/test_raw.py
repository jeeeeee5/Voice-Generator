"""
test_raw.py — 绕开完整 pipeline,直接测试中文场景下的音色一致性。

用法（backend/ 目录下）：
    python -m test_raw
"""

import os
from models.loader import tts
from inference.preprocess import build_speaker_refs, normalize_chinese

OUT_DIR = "outputs/test_raw"
os.makedirs(OUT_DIR, exist_ok=True)

VOICE = "John"
STYLE = "None"
SPEAKING_STYLE = "None"
EMOTION_LEVEL = 70

TEST_SENTENCE = "但这只会是浪费时间"
TEST_SENTENCE_TRAD = "但這隻會是浪費時間"


def run(label, text, emotion, language="zh-cn", force_no_emotion_blend=False):
    speaker_refs, emotion_weight, voice_ref, style_ref, emotion_ref, _ = build_speaker_refs(
        VOICE, STYLE, emotion, SPEAKING_STYLE, EMOTION_LEVEL
    )

    if force_no_emotion_blend and emotion_weight > 0:
        # 手动切掉末尾 emotion_weight 份 emotion_ref，
        # 不依赖 preprocess.py 里那个没被实际使用的 NO_BLEND_EMOTIONS
        speaker_refs = speaker_refs[:len(speaker_refs) - emotion_weight]
        emotion_weight = 0

    print(f"[{label}] emotion={emotion} refs={len(speaker_refs)} emotion_weight={emotion_weight}")

    out_path = os.path.join(OUT_DIR, f"{label}.wav")

    if emotion == "Whisper":
        tts.tts_to_file(
            text=text, speaker_wav=speaker_refs, language=language,
            repetition_penalty=2.0, length_penalty=1.0,
            top_p=0.85, top_k=50, file_path=out_path,
        )
    else:
        tts.tts_to_file(
            text=text, speaker_wav=speaker_refs, language=language,
            repetition_penalty=6.0, length_penalty=1.3,
            top_p=0.85, top_k=50, enable_text_splitting=True,
            file_path=out_path,
        )

    print(f"  -> saved {out_path}")


if __name__ == "__main__":
    # 1. 基准
    run("01_baseline_neutral", TEST_SENTENCE, emotion="Neutral")

    # 3. 已知/待判定问题情感
    for emo in ["Sad", "Crying", "Disappointed"]:
        run(f"03_{emo.lower()}", TEST_SENTENCE, emotion=emo)

    # 3b. Serious 音色漂移诊断：blend vs no-blend 对照
    #     如果 no_blend 版本音色恢复正常，说明确实是参考音频混合导致的漂移，
    #     可以把 Serious 正式加进 preprocess.py 的 NO_BLEND_EMOTIONS。
    run("03b_serious_WITH_NO_blend", TEST_SENTENCE, emotion="Serious",
        force_no_emotion_blend=True)
    run("03b_crying_WITH_NO_blend", TEST_SENTENCE, emotion="Crying",
            force_no_emotion_blend=True)
    run("03b_disappointed_WITH_NO_blend", TEST_SENTENCE, emotion="Disappointed",
            force_no_emotion_blend=True)


    # 4. 简繁体一致性 + 卡顿是否为偶发采样噪声
    #    连续生成 3 次繁体版本（转换后文字相同），对比彼此是否也有差异——
    #    如果 3 次里只有 1 次卡顿，说明是采样噪声，不是转换或模型的系统性问题。
    converted = normalize_chinese(TEST_SENTENCE_TRAD)
    assert converted == TEST_SENTENCE, (
        f"转换结果不一致！转换后='{converted}' 期望='{TEST_SENTENCE}'"
    )
    run("04_simplified", TEST_SENTENCE, emotion="Neutral")
    for i in range(1, 4):
        run(f"04_traditional_converted_take{i}", converted, emotion="Neutral")

