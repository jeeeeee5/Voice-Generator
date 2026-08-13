"""
Parses raw input text containing (Emotion) tags and pause markers into an
ordered list of segments the TTS pipeline can generate one at a time and
stitch back together.

Supported emotion / expression tags:
    (Neutral) (Happy) (Sad) (Angry) (Nervous) (Scared) (Whisper) (Excited)
    (Laugh) (Sigh) (Crying) (Serious) (Calm) (Confident) (Surprised)
    (Disappointed)

Supported pause markers:
    ...          short pause
    ....         long pause
    ,            small pause
    . ? !        sentence-ending pause
    [Pause]      custom pause (default length)
    [Pause:1.2]  custom pause with an explicit duration in seconds

Example
-------
>>> parse_tagged_text("(Nervous) I don't know... maybe we should leave. (Sigh)")
[
    {"type": "speech", "text": "I don't know", "emotion": "Nervous"},
    {"type": "pause", "duration": 0.3},
    {"type": "speech", "text": "maybe we should leave", "emotion": "Nervous"},
    {"type": "pause", "duration": 0.4},
    {"type": "sfx", "sfx": "sigh"},
]
"""

import re

# Tags recognised inside (Parentheses). Anything else in parentheses is
# left in the text as-is rather than silently dropped, so a typo like
# "(Nervus)" is visible in the output instead of vanishing.
EMOTION_TAGS = {
    "Neutral", "Happy", "Sad", "Angry", "Nervous", "Scared", "Whisper",
    "Excited", "Laugh", "Sigh", "Crying", "Serious", "Calm", "Confident",
    "Surprised", "Disappointed",
}

# 放在 EMOTION_TAGS = {...} 定义之后
TAG_ALIASES = {
    "Neutral":      ["中性"],
    "Happy":        ["开心", "開心", "高兴", "高興"],
    "Sad":          ["伤心", "傷心", "难过", "難過"],
    "Angry":        ["生气", "生氣"],
    "Nervous":      ["紧张", "緊張"],
    "Scared":       ["害怕"],
    "Whisper":      ["耳语", "耳語", "低语", "低語"],
    "Excited":      ["兴奋", "興奮"],
    "Laugh":        ["笑"],
    "Sigh":         ["叹气", "嘆氣"],
    "Crying":       ["哭泣", "哭"],
    "Serious":      ["严肃", "嚴肅"],
    "Calm":         ["冷静", "冷靜"],
    "Confident":    ["自信"],
    "Surprised":    ["惊讶", "驚訝"],
    "Disappointed": ["失望"],
}

_ALIAS_TO_CANONICAL = {}
for _canon in EMOTION_TAGS:
    _ALIAS_TO_CANONICAL[_canon.lower()] = _canon
for _canon, _aliases in TAG_ALIASES.items():
    for _alias in _aliases:
        _ALIAS_TO_CANONICAL[_alias.lower()] = _canon

_ALL_ALIAS_TEXT = sorted(_ALIAS_TO_CANONICAL.keys(), key=len, reverse=True)

# These tags represent a standalone vocal effect (a breath, a laugh) rather
# than a sustained emotional state — they don't become the "current
# emotion" for the text that follows, they just insert a short expressive
# beat of their own.
# Sigh is a standalone vocal effect only — it doesn't change the emotion
# carried by the text that follows.
PURE_SFX_TAGS = {"Sigh"}

# Laugh is both a sound effect AND an emotional state — the laugh sound
# plays, and the text that follows is also spoken with the Laugh emotion,
# since laughing speech ("Haha, that's funny!") should sound like it's
# still laughing, not flat.
SFX_AND_EMOTION_TAGS = {"Sigh", "Laugh"}

SFX_TAGS = PURE_SFX_TAGS | SFX_AND_EMOTION_TAGS

# Pause durations in seconds. These are starting points — tune them
# against real playback once wired into generate_voice.py.
PAUSE_DURATIONS = {
    "short": 0.3,     # ...
    "long": 0.8,      # ....
    "small": 0.15,    # ,
    "sentence": 0.4,  # . ? !
    "custom": 1.0,    # [Pause] with no explicit duration
}

EXCLAMATION_MARKS = {"!", "！"}


def _has_exclamation(text):
    return any(mark in text for mark in EXCLAMATION_MARKS)

_TAG_RE = re.compile(
    r"[\(（](" + "|".join(re.escape(a) for a in _ALL_ALIAS_TEXT) + r")[\)）]",
    re.IGNORECASE,
)

_CUSTOM_PAUSE_RE = re.compile(r"\[Pause(?::(\d+(?:\.\d+)?))?\]", re.IGNORECASE)

_PAUSE_MARKER_RE = re.compile(
    r"(?P<custom>\[Pause(?::\d+(?:\.\d+)?)?\])"
    r"|(?P<long>\.{4,}|…{2,})"
    r"|(?P<short>\.{3}|…)"
    r"|(?P<comma>,|，)"
    r"|(?P<sentence_end>\.(?!\.)|[?!？！]|。)",
    re.IGNORECASE,
)

# Segments shorter than this (in words) are prone to hallucinated/dropped
# syllables when sent to the TTS model on their own — there's not enough
# content for the autoregressive decoder to establish good context. This
# most often happens with dense emotion-tag switching, e.g.
# "(Angry) No. (Happy) Wait." producing single-word segments.
MIN_SEGMENT_WORDS = 3

def _segment_length(text):
    """
    Estimate segment length for both English and Chinese.
    English uses whitespace-separated words.
    Chinese uses CJK characters.
    """
    cjk_chars = re.findall(r"[\u4e00-\u9fff]", text)

    if cjk_chars:
        return len(cjk_chars)

    return len(text.split())


def _merge_short_segments(segments):
    """
    Post-process pass: merge a too-short speech segment into the next
    speech segment when they share the same emotion, dropping the pause
    between them. Non-speech segments (pause/sfx) and segments that would
    merge across a different emotion are left alone — we only ever merge
    same-emotion speech to avoid changing what emotion a word is spoken
    in, or dropping a pause that's meant to separate two states.
    """
    merged = []
    i = 0
    n = len(segments)

    while i < n:
        seg = segments[i]

        if seg["type"] != "speech":
            merged.append(seg)
            i += 1
            continue

        word_count = _segment_length(seg["text"])

        # Too short, and there's a same-emotion speech segment just past
        # the next item (typically a pause) to merge with — merge them
        # and drop the pause in between, rather than sending a 1-2 word
        # fragment to the model on its own.
        if word_count < MIN_SEGMENT_WORDS and i + 2 < n:
            pause_seg = segments[i + 1]
            next_seg = segments[i + 2]
            if (
                pause_seg["type"] == "pause"
                and next_seg["type"] == "speech"
                and next_seg["emotion"] == seg["emotion"]
                and pause_seg["duration"] == PAUSE_DURATIONS["small"]
            ):
                combined_text = f"{seg['text']}, {next_seg['text']}"
                merged.append({
                    "type": "speech",
                    "text": combined_text,
                    "emotion": seg["emotion"],
                    "intensity": (
                        "strong"
                        if seg.get("intensity") == "strong"
                        or next_seg.get("intensity") == "strong"
                        else "normal"
                    ),
                })
                i += 3  # skip seg, the pause, and next_seg — all consumed
                continue

        merged.append(seg)
        i += 1

    return merged


def parse_tagged_text(raw_text: str, default_emotion: str = "Neutral"):
    """
    Parse text containing (Emotion) tags and pause markers into an ordered
    list of segments for the TTS pipeline.

    `default_emotion` is used for any text that appears before the first
    emotion tag (or for plain text with no tags at all) — normally this
    should be whatever emotion the user picked in the UI dropdown, so
    untagged text keeps behaving exactly like it did before tags existed.

    Returns a list of dicts, each one of:
        {"type": "speech", "text": str, "emotion": str}
        {"type": "pause", "duration": float}
        {"type": "sfx", "sfx": str}          # e.g. "sigh", "laugh"

    Pause markers are stripped out of the text sent to the TTS model and
    converted into explicit silence segments instead, so pause length is
    controlled here rather than left to the model's own interpretation of
    punctuation.
    """
    segments = []
    current_emotion = default_emotion
    pending_text = ""

    def flush_pending():
        nonlocal pending_text
        stripped = pending_text.strip()

        if stripped:
            segments.append({
                "type": "speech",
                "text": stripped,
                "emotion": current_emotion,
                "intensity": "normal",
            })

        pending_text = ""

    i = 0
    length = len(raw_text)

    while i < length:
        tag_match = _TAG_RE.match(raw_text, i)
        if tag_match:
            matched_text = tag_match.group(1).strip()
            tag_name = _ALIAS_TO_CANONICAL.get(matched_text.lower())

            if tag_name in EMOTION_TAGS:
                flush_pending()
                if tag_name in SFX_TAGS:
                    segments.append({"type": "sfx", "sfx": tag_name.lower()})

                if tag_name in SFX_AND_EMOTION_TAGS or tag_name not in SFX_TAGS:
                    current_emotion = tag_name
            else:
                # Unrecognised tag: keep it as literal text so it's
                # visible rather than silently discarded.
                pending_text += tag_match.group(0)

            i = tag_match.end()
            continue

        pause_match = _PAUSE_MARKER_RE.match(raw_text, i)
        if pause_match:
            flush_pending()

            if pause_match.group("custom"):
                custom_match = _CUSTOM_PAUSE_RE.match(pause_match.group("custom"))
                duration = (
                    float(custom_match.group(1))
                    if custom_match and custom_match.group(1)
                    else PAUSE_DURATIONS["custom"]
                )
            elif pause_match.group("long"):
                duration = PAUSE_DURATIONS["long"]
            elif pause_match.group("short"):
                duration = PAUSE_DURATIONS["short"]
            elif pause_match.group("comma"):
                duration = PAUSE_DURATIONS["small"]
            else:  # sentence_end: . or ? or !
                duration = PAUSE_DURATIONS["sentence"]

            pause_text = pause_match.group(0)

            is_exclamation = "!" in pause_text or "！" in pause_text

            if is_exclamation and segments:
                for previous in reversed(segments):
                    if previous["type"] == "speech":
                        previous["intensity"] = "strong"
                        break

            segments.append({"type": "pause", "duration": duration})
            i = pause_match.end()
            continue

        # Ordinary text — consume one character and keep scanning.
        pending_text += raw_text[i]
        i += 1

    flush_pending()
    return _merge_short_segments(segments)


if __name__ == "__main__":
    sample = "(Nervous) I want to go... (Sigh) But it will be just a rush. (Laugh)"
    for seg in parse_tagged_text(sample):
        print(seg)
