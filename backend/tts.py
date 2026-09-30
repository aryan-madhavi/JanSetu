import os
import base64
import logging
from google.cloud import texttospeech

logger = logging.getLogger("tts")

def generate_tts_reply(ticket_id: str, language: str = "Hindi", specific_need: str = None):
    # Map languages to localized text and Google Cloud TTS voices
    locales = {
        'Hindi': {'code': 'hi-IN', 'voice': 'hi-IN-Standard-A', 'text': f"नमस्ते! आपका आवेदन सफलतापूर्वक दर्ज कर लिया गया है। आपका टिकट नंबर {ticket_id} है। संबंधित विभाग द्वारा इस पर शीघ्र कार्रवाई की जाएगी। धन्यवाद।"},
        'Marathi': {'code': 'mr-IN', 'voice': 'mr-IN-Standard-A', 'text': f"नमस्कार! तुमचा अर्ज यशस्वीरीत्या नोंदवला गेला आहे. तुमचा तिकीट क्रमांक {ticket_id} आहे. संबंधित विभागामार्फत लवकरच कार्यवाही केली जाईल. धन्यवाद."},
        'Tamil': {'code': 'ta-IN', 'voice': 'ta-IN-Standard-A', 'text': f"வணக்கம்! உங்கள் கோரிக்கை வெற்றிகரமாக பதிவு செய்யப்பட்டது. உங்கள் டிக்கெட் எண் {ticket_id}. சம்பந்தப்பட்ட துறை விரைவில் நடவடிக்கை எடுக்கும்."},
        'Bengali': {'code': 'bn-IN', 'voice': 'bn-IN-Standard-A', 'text': f"নমস্কার! আপনার আবেদনটি সফলভাবে গৃহীত হয়েছে। আপনার টিকিট নম্বর {ticket_id}। সংশ্লিষ্ট বিভাগ দ্রুত ব্যবস্থা গ্রহণ করবে।"},
        'English': {'code': 'en-IN', 'voice': 'en-IN-Standard-C', 'text': f"Namaste! Your infrastructure grievance has been successfully registered. Your ticket ID is {ticket_id}. The department has been notified for resolution."}
    }
    
    cfg = locales.get(language, locales['Hindi'])
    reply_text = cfg['text']
    audio_base64 = None
    
    try:
        client = texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.SynthesisInput(text=reply_text)
        voice = texttospeech.VoiceSelectionParams(
            language_code=cfg['code'],
            name=cfg['voice']
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        audio_base64 = base64.b64encode(response.audio_content).decode('utf-8')
    except Exception as e:
        logger.warning(f"Cloud Text-to-Speech synthesis error: {e}")
        audio_base64 = None
        
    return reply_text, audio_base64
