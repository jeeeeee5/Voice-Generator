from fastapi import APIRouter
from fastapi.responses import FileResponse
from pydantic import BaseModel
from inference.generate_voice import generate_speech

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    voice: str
    style: str = "Warm"
    speed: float = 1.0
    pitch: float = 0
    emotion_level: int = 50
    emotion: str = "Neutral"
    expressiveness: int = 50


@router.get("/")
def root():
    return {"message": "AI Text-to-Voice API is running"}


@router.post("/generate")
def generate(request: TTSRequest):
    output_path = "outputs/generated_audio/speech.wav"

    generate_speech(
        text=request.text,
        style=request.style,
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