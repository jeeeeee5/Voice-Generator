from fastapi import APIRouter
from fastapi.responses import FileResponse
from pydantic import BaseModel

from inference.generate_voice import generate_speech

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    voice: str
    speed: float = 1.0
    language: str = "en"


@router.get("/")
def root():
    return {"message": "AI Text-to-Voice API is running"}


@router.post("/generate")
def generate(request: TTSRequest):
    output_path = "outputs/generated_audio/speech.wav"

    generate_speech(
        text=request.text,
        voice=request.voice,
        output_path=output_path,
        speed=request.speed,
        language=request.language,
    )

    return FileResponse(
        output_path,
        media_type="audio/wav",
        filename="speech.wav"
    )