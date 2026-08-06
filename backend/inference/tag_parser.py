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

# These tags represent a standalone vocal effect (a breath, a laugh) rather
# than a sustained emotional state — they don't become the "current
# emotion" for the text that follows, they just insert a short expressive
# beat of their own.
SFX_TAGS = {"Sigh", "Laugh"}

# Pause durations in seconds. These are starting points — tune them
# against real playback once wired into generate_voice.py.
PAUSE_DURATIONS = {
    "short": 0.3,     # ...
    "long": 0.8,      # ....
    "small": 0.15,    # ,
    "sentence": 0.4,  # . ? !
    "custom": 1.0,    # [Pause] with no explicit duration
}

_TAG_RE = re.compile(r"\(([A-Za-z]+)\)")

_CUSTOM_PAUSE_RE = re.compile(r"\[Pause(?::(\d+(?:\.\d+)?))?\]", re.IGNORECASE)

# Order matters: longer/more specific patterns must be tried before shorter
# ones that would otherwise swallow part of them (e.g. "...." before "...").
# "?" and "!" are treated the same as "." for sentence-ending pauses —
# they can't be part of an ellipsis, so no lookahead is needed for them.
_PAUSE_MARKER_RE = re.compile(
    r"(?P<custom>\[Pause(?::\d+(?:\.\d+)?)?\])"
    r"|(?P<long>\.{4,})"
    r"|(?P<short>\.{3})"
    r"|(?P<comma>,)"
    r"|(?P<sentence_end>\.(?!\.)|[?!])",
    re.IGNORECASE,
)


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
            })
        pending_text = ""

    i = 0
    length = len(raw_text)

    while i < length:
        tag_match = _TAG_RE.match(raw_text, i)
        if tag_match:
            tag_name = tag_match.group(1).strip().title()

            if tag_name in EMOTION_TAGS:
                flush_pending()
                if tag_name in SFX_TAGS:
                    segments.append({"type": "sfx", "sfx": tag_name.lower()})
                    # SFX tags are a one-off beat — they don't change the
                    # emotion carried by the text that follows.
                else:
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

            segments.append({"type": "pause", "duration": duration})
            i = pause_match.end()
            continue

        # Ordinary text — consume one character and keep scanning.
        pending_text += raw_text[i]
        i += 1

    flush_pending()
    return segments


if __name__ == "__main__":
    sample = "(Nervous) I want to go... (Sigh) But it will be just a rush. (Laugh)"
    for seg in parse_tagged_text(sample):
        print(seg)
