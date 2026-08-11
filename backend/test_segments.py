from inference.tag_parser import parse_tagged_text

text = "(Nervous) I don't think this is right. (Angry) No, actually forget it. (Happy) Wait, maybe it's fine after all."

segments = parse_tagged_text(text, default_emotion="Neutral")
for seg in segments:
    print(seg)