import os
import json
import logging
from google import genai
from google.genai import types

logger = logging.getLogger("extraction")

PROBED_LOCATION = None

def get_genai_client():
    global PROBED_LOCATION
    if PROBED_LOCATION:
        return genai.Client(vertexai=True, project="jansetu-510215", location=PROBED_LOCATION)
    
    locations = ["asia-south1", "us-central1", "global"]
    for loc in locations:
        try:
            client = genai.Client(vertexai=True, project="jansetu-510215", location=loc)
            resp = client.models.generate_content(model="gemini-2.5-flash", contents="ping")
            if resp and resp.text:
                PROBED_LOCATION = loc
                logger.info(f"Successfully connected to Vertex AI at location: {loc}")
                return client
        except Exception as e:
            logger.warning(f"Vertex probe at {loc} failed: {e}")
            
    # Default fallback
    PROBED_LOCATION = "asia-south1"
    return genai.Client(vertexai=True, project="jansetu-510215", location=PROBED_LOCATION)

def detect_audio_mime(filename: str) -> str:
    if not filename:
        return "audio/webm"
    ext = os.path.splitext(filename)[1].lower()
    mapping = {
        ".webm": "audio/webm",
        ".ogg": "audio/ogg",
        ".oga": "audio/ogg",
        ".wav": "audio/wav",
        ".mp3": "audio/mp3",
        ".mp4": "audio/mp4",
        ".m4a": "audio/mp4",
        ".flac": "audio/flac"
    }
    return mapping.get(ext, "audio/webm")

def extract_request_info(text: str = None, audio_path: str = None, image_path: str = None, audio_filename: str = None, **kwargs):
    client = get_genai_client()
    contents = []
    
    prompt = """You are JanSetu's citizen request extraction engine. Analyze the provided text, audio, and/or image.
Extract the following information and output ONLY valid JSON matching this schema:
{
  "transcript_original": "The exact transcript of the audio or the original text provided, in its original language",
  "language": "The detected language (e.g. Hindi, Marathi, Tamil, Bengali, English)",
  "english_summary": "A clear, concise summary in English with PII redacted",
  "sector": "Must be one of: water, roads, health, education, electricity, sanitation, connectivity, housing, agriculture",
  "specific_need": "A short 2-4 word phrase describing the specific infrastructure failure",
  "severity": 1 to 5 integer (1 is low, 5 is critical emergency threatening life/health),
  "sentiment": "One of: Positive, Neutral, Negative, Angry",
  "affected_population_estimate": 0 if unknown else estimated integer,
  "location_text": "Extracted village, ward, district, or landmark if mentioned, else empty string",
  "image_findings": "If an image is attached, describe the physical damage visible, else empty string"
}
"""
    contents.append(prompt)
    
    if text:
        contents.append(f"Citizen text report: {text}")
        
    if audio_path and os.path.exists(audio_path):
        mime = detect_audio_mime(audio_filename or audio_path)
        with open(audio_path, "rb") as f:
            audio_bytes = f.read()
        contents.append(types.Part.from_bytes(data=audio_bytes, mime_type=mime))
        
    if image_path and os.path.exists(image_path):
        with open(image_path, "rb") as f:
            image_bytes = f.read()
        contents.append(types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))
        
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        data = json.loads(response.text)
        return data
    except Exception as e:
        logger.error(f"Error in Gemini extraction: {e}")
        # Deterministic fallback extraction if network or model fails
        return {
            "transcript_original": text or "Voice recording submission",
            "language": "Hindi" if any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in (text or "")) else "English",
            "english_summary": text or "Citizen reported an infrastructure defect.",
            "sector": "water" if any(w in (text or "").lower() for w in ["water", "pani", "paani", "jal", "pipe"]) else "roads",
            "specific_need": "Infrastructure Maintenance",
            "severity": 3,
            "sentiment": "Negative",
            "affected_population_estimate": 100,
            "location_text": "",
            "image_findings": ""
        }
