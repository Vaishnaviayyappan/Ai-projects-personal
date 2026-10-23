
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import speech_recognition as sr
from typing import Optional

app = FastAPI()

# Pydantic models
class User(BaseModel):
    name: str
    email: str

class VoiceInput(BaseModel):
    audio_file: Optional[str] = None

class FormInput(BaseModel):
    name: str
    email: str

class PhoneCallInput(BaseModel):
    phone_number: str
    message: str

# Speech recognition settings
r = sr.Recognizer()
mic = sr.Microphone()

@app.get("/form")
async def form_input():
    return {"message": "Please speak to fill the form"}

@app.post("/form")
async def create_form(form_data: FormInput):
    user = User(name=form_data.name, email=form_data.email)
    # Save to database
    return JSONResponse(content={"message": f"Form filled by {user.name} ({user.email})"}, status_code=201)

@app.get("/phone-call")
async def phone_call_input():
    return {"message": "Please speak your message"}

@app.post("/phone-call")
async def create_phone_call(phone_data: PhoneCallInput):
    # Save to database
    return JSONResponse(content={"message": f"Phone call with {phone_data.phone_number}"}, status_code=201)

@app.post("/voice-input")
async def create_voice_input(voice_data: VoiceInput):
    try:
        with mic as source:
            r.adjust_for_ambient_noise(source)
            audio = r.listen(source, phrase_time_limit=5)
        return JSONResponse(content={"message": "Audio recorded successfully"}, status_code=201)
    except sr.UnknownValueError:
        return JSONResponse(content={"error": "Audio not recognized"}, status_code=400)

@app.post("/voice-call")
async def create_voice_call(request: Request):
    audio_file = request.files["audio"]
    try:
        with mic as source:
            r.adjust_for_ambient_noise(source)
            audio = r.listen(source, phrase_time_limit=5)
        # Use Google Cloud Speech-to-Text API or similar service
        return JSONResponse(content={"message": "Voice call recorded successfully"}, status_code=201)
    except sr.UnknownValueError:
        return JSONResponse(content={"error": "Audio not recognized"}, status_code=400)
