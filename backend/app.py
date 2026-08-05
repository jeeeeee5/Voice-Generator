from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tts_engine import generate_speech

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TTSRequest(BaseModel):
    text: str
    voice: str
    style: str = "Warm"
    speed: float = 1.0
    pitch: float = 0
    emotion_level: int = 50
    emotion: str = "Neutral"
    expressiveness: int = 50


@app.get("/")
def root():
    return {"message": "AI Text-to-Voice API is running"}


@app.post("/generate")
def generate(request: TTSRequest):

    print("Speed:", request.speed)
    print("Style:", request.style)

    output_path = "output/speech.wav"

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