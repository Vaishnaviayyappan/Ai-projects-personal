import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from twilio.twiml.messaging_response import MessagingResponse
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Environment variables
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_NUMBER = os.environ.get("TWILIO_WHATSAPP_NUMBER")

# Initialize Anthropic client
anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

# In-memory session management
sessions = {}

# Load schemes database
SCHEMES_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'schemes.json')
try:
    with open(SCHEMES_PATH, 'r', encoding='utf-8') as f:
        schemes_db = json.load(f)
    logger.info(f"Loaded {len(schemes_db)} schemes from database.")
except Exception as e:
    logger.error(f"Error loading schemes database: {e}")
    schemes_db = []

# Conversation States
WELCOME = "WELCOME"
ASK_OCCUPATION = "ASK_OCCUPATION"
ASK_AGE = "ASK_AGE"
ASK_INCOME = "ASK_INCOME"
ASK_CASTE = "ASK_CASTE"
ASK_DISTRICT = "ASK_DISTRICT"
SHOW_RESULTS = "SHOW_RESULTS"

def get_session(phone_number):
    if phone_number not in sessions:
        sessions[phone_number] = {
            "state": WELCOME,
            "profile": {}
        }
    return sessions[phone_number]

def reset_session(phone_number):
    sessions[phone_number] = {
        "state": WELCOME,
        "profile": {}
    }

def format_whatsapp_response(message):
    resp = MessagingResponse()
    resp.message(message)
    return str(resp)

def call_claude_to_match_schemes(profile):
    if not anthropic_client:
        logger.warning("Anthropic API key not configured. Using local smart-matching fallback.")
        
        # Smart Local Fallback
        matched = []
        occ = profile.get('occupation', '')
        
        for s in schemes_db:
            en_name = s.get('scheme_name_english', '').lower()
            ta_name = s.get('scheme_name_tamil', '').lower()
            
            if occ == 'Farmer' and ('kisan' in en_name or 'uzhavar' in en_name):
                matched.append(s)
            elif occ == 'Student' and ('scholarship' in en_name or 'pudhumai' in en_name):
                matched.append(s)
            elif occ == 'Housewife/Woman' and ('magalir' in ta_name or 'urimai' in ta_name or 'thalikku' in en_name):
                matched.append(s)
            elif occ == 'Senior Citizen' and ('pension' in en_name or 'oivu' in ta_name):
                matched.append(s)
                
        # Fill with general schemes if not enough matches
        if len(matched) < 2:
            general = [s for s in schemes_db if 'ayushman' in s.get('scheme_name_english', '').lower() or 'pmaay' in s.get('scheme_name_english', '').lower()]
            matched.extend(general)
            
        result_text = ""
        for i, scheme in enumerate(matched[:3], 1):
            name = scheme.get('scheme_name_tamil', 'அரசு திட்டம்')
            benefit = scheme.get('benefit', {}).get('description_tamil', 'பயன் விவரங்கள் இணைக்கப்படவில்லை')
            reqs = ", ".join(scheme.get('documents_required', ['ஆதார் அட்டை']))
            
            result_text += f"*{i}. {name}*\n"
            result_text += f"🎁 பயன்: {benefit}\n"
            result_text += f"📝 தேவை: {reqs}\n\n"
            
        if not result_text.strip():
            return "உங்களுக்குப் பொருத்தமான திட்டங்கள் கிடைக்கவில்லை. இ-சேவை மையத்தை அணுகவும்."
            
        return result_text.strip()
    
    prompt = f"""
நீங்கள் 'உரிமை AI', தமிழ்நாடு மற்றும் மத்திய அரசின் திட்டங்களை மக்களுக்கு எடுத்துரைக்கும் வழிகாட்டி.
கீழே கொடுக்கப்பட்டுள்ள பயனரின் சுயவிவரத்தையும், அரசுத் திட்டங்களின் பட்டியலையும் ஒப்பிட்டு, அவர்களுக்குப் பொருத்தமான 3 சிறந்த திட்டங்களை தமிழில் சுருக்கமாகப் பட்டியலிடவும். ஒவ்வொரு திட்டத்திற்கும் பயன் மற்றும் எப்படி விண்ணப்பிப்பது என்பதைக் கூறவும்.

[பயனர் சுயவிவரம்]
{json.dumps(profile, ensure_ascii=False)}

[திட்டங்கள் பட்டியல்]
{json.dumps(schemes_db, ensure_ascii=False)}

உங்கள் பதிலை அன்பான கிராமத்து பெரியவர் போல தமிழில் தரவும். திட்டங்களை 1, 2, 3 என வரிசைப்படுத்தவும்.
"""
    try:
        message = anthropic_client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1000,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}]
        )
        return message.content[0].text
    except Exception as e:
        logger.error(f"Claude API Error: {e}")
        return "மன்னிக்கவும், தகவல்களைப் பெறுவதில் சிறு பிழை ஏற்பட்டுள்ளது. மீண்டும் முயற்சிக்கவும்."

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "schemes_loaded": len(schemes_db)}), 200

def process_message(sender, incoming_msg):
    logger.info(f"Received message from {sender}: {incoming_msg}")
    
    if incoming_msg.lower() in ["hi", "hello", "வணக்கம்", "restart", "0"]:
        reset_session(sender)

    session = get_session(sender)
    state = session["state"]
    profile = session["profile"]
    
    reply_message = ""

    if state == WELCOME:
        reply_message = (
            "வணக்கம்! நான் உரிமை AI (உங்கள் அரசுத் திட்ட வழிகாட்டி). உங்களுக்குப் பொருத்தமான திட்டங்களைக் கண்டறிய சில கேள்விகள் கேட்கிறேன்.\n\n"
            "நீங்கள் என்ன செய்கிறீர்கள்? (சரியான எண்ணை டைப் செய்யவும்)\n"
            "1. விவசாயி\n"
            "2. மாணவர் / மாணவி\n"
            "3. குடும்பத் தலைவி / பெண்கள்\n"
            "4. முதியவர்\n"
            "5. கூலித் தொழிலாளி\n"
            "6. மற்றவை"
        )
        session["state"] = ASK_OCCUPATION
        
    elif state == ASK_OCCUPATION:
        occupations = {"1": "Farmer", "2": "Student", "3": "Housewife/Woman", "4": "Senior Citizen", "5": "Worker", "6": "Other"}
        profile["occupation"] = occupations.get(incoming_msg, "Other")
        
        reply_message = "நன்று. உங்கள் வயது என்ன? (உதாரணம்: 25)"
        session["state"] = ASK_AGE
        
    elif state == ASK_AGE:
        profile["age"] = incoming_msg
        
        reply_message = (
            "உங்கள் குடும்பத்தின் தோராயமான ஆண்டு வருமானம் எவ்வளவு? (எண்ணை டைப் செய்யவும்)\n"
            "1. ₹1 லட்சத்திற்கு கீழ்\n"
            "2. ₹1 முதல் ₹2.5 லட்சம் வரை\n"
            "3. ₹2.5 லட்சத்திற்கு மேல்"
        )
        session["state"] = ASK_INCOME
        
    elif state == ASK_INCOME:
        incomes = {"1": "<1 Lakh", "2": "1-2.5 Lakhs", "3": ">2.5 Lakhs"}
        profile["income_bracket"] = incomes.get(incoming_msg, "Unknown")
        
        reply_message = (
            "அரசின் இட ஒதுக்கீடு மற்றும் சலுகைகளுக்காக உங்கள் சாதிப் பிரிவைத் தேர்ந்தெடுக்கவும்:\n"
            "1. SC / ST\n"
            "2. MBC / DNC\n"
            "3. BC / BCM\n"
            "4. OC (பொதுப் பிரிவு)"
        )
        session["state"] = ASK_CASTE
        
    elif state == ASK_CASTE:
        castes = {"1": "SC/ST", "2": "MBC/DNC", "3": "BC/BCM", "4": "OC"}
        profile["caste"] = castes.get(incoming_msg, "Unknown")
        
        reply_message = "கடைசிக் கேள்வி! நீங்கள் எந்த மாவட்டம்? (உதாரணம்: மதுரை, சேலம்)"
        session["state"] = ASK_DISTRICT
        
    elif state == ASK_DISTRICT:
        profile["district"] = incoming_msg
        session["state"] = SHOW_RESULTS
        
        matched_schemes_text = call_claude_to_match_schemes(profile)
        
        reply_message = (
            f"மிக்க நன்றி! உங்கள் விவரங்களை ஆராய்ந்து விட்டேன். உங்களுக்கான திட்டங்கள் இதோ:\n\n"
            f"{matched_schemes_text}\n\n"
            f"மீண்டும் தேட 'Hi' அல்லது 'வணக்கம்' என்று அனுப்பவும்."
        )
        reset_session(sender)

    return reply_message

@app.route('/webhook', methods=['POST'])
def webhook():
    try:
        incoming_msg = request.values.get('Body', '').strip()
        sender = request.values.get('From', '')
        if not sender: return "No sender specified", 400
        reply = process_message(sender, incoming_msg)
        return format_whatsapp_response(reply)
    except Exception as e:
        logger.error(f"Webhook Error: {e}", exc_info=True)
        return format_whatsapp_response("மன்னிக்கவும், பிழை ஏற்பட்டுள்ளது.")

@app.route('/api/chat', methods=['POST'])
def api_chat():
    try:
        data = request.get_json()
        incoming_msg = data.get('message', '').strip()
        sender = data.get('session_id', 'web_user')
        if not sender: return jsonify({"error": "No session_id"}), 400
        reply = process_message(sender, incoming_msg)
        return jsonify({"reply": reply})
    except Exception as e:
        logger.error(f"API Error: {e}", exc_info=True)
        return jsonify({"reply": "மன்னிக்கவும், பிழை ஏற்பட்டுள்ளது."})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
