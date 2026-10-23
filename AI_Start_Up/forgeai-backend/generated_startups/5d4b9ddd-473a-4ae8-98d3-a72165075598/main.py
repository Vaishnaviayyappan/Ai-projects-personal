
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import speech_recognition as sr

app = FastAPI()

class UserRequest(BaseModel):
    name: str
    email: str

class FormInput(BaseModel):
    phone_number: str
    address: str

@app.post("/start")
async def start(request: Request):
    return JSONResponse({"message": "Welcome to Voice-First AI"})

@app.post("/recognize-speech")
async def recognize_speech():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        audio = r.listen(source)
        try:
            text = r.recognize_google(audio, language="en-US")
            return JSONResponse({"text": text})
        except sr.UnknownValueError:
            return JSONResponse({"error": "Audio could not be recognized"})
        except sr.RequestError:
            return JSONResponse({"error": "Request error"})

@app.post("/fill-form", response_model=FormInput)
async def fill_form(form_data: FormInput):
    print(f"Name: {form_data.name}, Email: {form_data.email}")
    return form_data

@app.post("/navigate")
async def navigate():
    # Implement navigation logic here
    return JSONResponse({"message": "Navigation started"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)



# models.py

from pydantic import BaseModel

class UserRequest(BaseModel):
    name: str
    email: str

class FormInput(BaseModel):
    phone_number: str
    address: str

Note: The navigation and WhatsApp voice support are not implemented yet. They would require additional code, such as using the Twilio API for WhatsApp or implementing a navigation system with geolocation data.