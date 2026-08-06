# Voice Generator

An AI-powered text-to-voice generator with a React frontend and a Python (FastAPI) backend. Uses [XTTS](https://github.com/coqui-ai/TTS) for voice cloning, blending reference clips for voice identity, style, emotion, and speaking style, with adjustable speed, pitch, and expressiveness.

## Features

- Text-to-speech generation from any input text
- Voice selection (10 built-in identities)
- Voice style, emotion, and speaking style blending
- Adjustable speed, pitch, emotion intensity, and expressiveness
- Save/load custom voice presets (stored locally in the browser)
- In-browser audio playback with waveform visualization
- Download generated audio as `.wav`

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, lucide-react
- **Backend:** FastAPI, [Coqui TTS](https://github.com/coqui-ai/TTS) (XTTS v2), librosa, soundfile, [pyrubberband](https://github.com/bmcfee/pyrubberband) (time-stretching for the speed/emotion DSP pass — noticeably cleaner than librosa's phase vocoder, avoids the "echo"-like artifacts it introduces)

## Project Structure

```
Voice-Generator/
│
├── frontend/                  # React app
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/        # Sidebar, PromptBox, VoiceCard, SettingsPanel, AudioPlayer, Footer
│   │   ├── pages/              # Home, History, Settings
│   │   ├── services/           # api.js, voiceOptions.js, presetData.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                   # Python (FastAPI)
│   ├── app.py                  # App entrypoint
│   ├── requirements.txt
│   │
│   ├── models/
│   │   ├── loader.py            # Loads the XTTS model
│   │   └── voice_model.py       # Voice/style/emotion reference maps
│   │
│   ├── inference/
│   │   ├── generate_voice.py    # Main generation pipeline
│   │   └── preprocess.py        # Builds blended reference audio list
│   │
│   ├── api/
│   │   └── routes.py            # API routes
│   │
│   ├── utils/
│   │   └── audio.py             # Speed/pitch/gain/expressiveness DSP
│   │
│   ├── voices/                  # Reference audio clips (identity/style/emotion/speaking_style)
│   ├── outputs/generated_audio/ # Generated .wav output
│   └── temp/
│
├── models/                    # Downloaded model weights (TTS/Vocoder/Speaker)
├── datasets/                  # Optional training data
├── docs/
└── README.md
```

## Setup

### Backend

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

**Additional dependency — Rubber Band:** `pyrubberband` is a wrapper around the [Rubber Band Library](https://breakfastquay.com/rubberband/) command-line tool, so the `rubberband` binary must also be installed separately and available on your system `PATH` (it isn't installed by `pip`).

- **Windows:** download the Rubber Band CLI build from the [Rubber Band website](https://breakfastquay.com/rubberband/), unzip it, and add the folder containing `rubberband.exe` to your PATH.
- **macOS:** `brew install rubberband`
- **Linux:** `sudo apt install rubberband-cli` (Debian/Ubuntu) or your distro's equivalent.

Verify it's on PATH:

```bash
rubberband -V
```

Run the API server:

```bash
uvicorn app:app --reload
```

The API will be available at `http://127.0.0.1:8000`. Interactive docs at `http://127.0.0.1:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## API

### `POST /generate`

Generates speech audio from text and voice settings.

**Request body:**

```json
{
  "text": "Hello, this is a test.",
  "voice": "Sarah",
  "style": "Warm",
  "speed": 1.0,
  "pitch": 0,
  "emotion_level": 50,
  "emotion": "Neutral",
  "expressiveness": 50
}
```

**Response:** `audio/wav` file stream.
