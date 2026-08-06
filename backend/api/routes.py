from fastapi import APIRouter
from fastapi.responses import FileResponse
from pydantic import BaseModel

from inference.generate_voice import generate_speech
from inference.tag_parser import parse_tagged_text

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    voice: str
    style: str = "Warm"
    speaking_style: str = "Casual"
    speed: float = 1.0
    pitch: float = 0
    emotion_level: int = 50
    emotion: str = "Neutral"
    expressiveness: int = 50


class ParseRequest(BaseModel):
    text: str
    emotion: str = "Neutral"


@router.get("/")
def root():
    return {"message": "AI Text-to-Voice API is running"}


@router.post("/parse")
def parse(request: ParseRequest):
    """
    Preview-only: parses (Emotion) tags and pause markers without
    generating any audio, so the frontend can show a live breakdown of
    how a line of text will be split up before the user hits Generate.
    """
    segments = parse_tagged_text(request.text, default_emotion=request.emotion)
    return {"segments": segments}


@router.post("/generate")
def generate(request: TTSRequest):
    output_path = "outputs/generated_audio/speech.wav"

    generate_speech(
        text=request.text,
        style=request.style,
        speaking_style=request.speaking_style,
        voice=request.voice,
        output_path=output_path,
        speed=request.speed,
        pitch=request.pitch,
        emotion_level=request.emotion_level,
        expressiveness=request.expressiveness,
        emotion=request.emotion,
    )
    return FileResponse(
        output_path,
        media_type="audio/wav",
        filename="speech.wav"
    )
