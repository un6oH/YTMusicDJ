from fastapi import FastAPI, Request
from pydantic import BaseModel
import yt_dlp
import essentia
import essentia.standard as es
import os
import uuid

app = FastAPI()

class AnalysisRequest(BaseModel):
  youtube_url: str

@app.post("/analyze")
async def analyze(request: AnalysisRequest):
  # 1. Download audio
  audio_id = str(uuid.uuid4())
  audio_path = f"/tmp/{audio_id}.mp3"
  ydl_opts = {
    'format': 'bestaudio/best',
    'outtmpl': audio_path,
    'postprocessors': [{
      'key': 'FFmpegExtractAudio',
      'preferredcodec': 'mp3',
    }]
  }
  with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    ydl.download([request.youtube_url])

  # 2. Analyze audio
  audio = es.MonoLoader(filename=audio_path)()
  duration = es.Duration()(audio)
  mfcc = es.MFCC()(audio)
  tempo = es.RhythmExtractor2013()(audio)
  key, scale, strength = es.KeyExtractor()(audio)

  # 3. Clean up
  os.remove(audio_path)

  # 4. Return results
  return {
    "duration": duration,
    "mfcc": mfcc[1].tolist(),
    "tempo": tempo,
    "key": key,
    "scale": scale,
    "strength": strength
  }