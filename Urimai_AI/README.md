# Urimai AI 🇮🇳 (உரிமை AI)

Urimai AI is a conversational WhatsApp chatbot designed to help citizens of Tamil Nadu discover and claim government welfare schemes they are eligible for. By asking a few simple questions in Tamil, the bot acts as a friendly village elder, matching users to life-changing schemes and removing the barriers of complex bureaucratic language.

## Tech Stack
- **Backend:** Python, Flask
- **AI Integration:** Anthropic Claude API
- **Messaging API:** Twilio WhatsApp API
- **Database:** Supabase (PostgreSQL)

## Folder Structure
- `backend/` - Contains the Python Flask application, API integrations, and webhook handlers.
- `frontend/` - Contains any web-based dashboard or landing page components.
- `database/` - Contains Supabase SQL schema definitions and sample data JSON files.
- `docs/` - Contains project documentation, pitch decks, and technical design documents.

## Setup & Running the Project
1. **Clone & Setup Environment:**
   Navigate into the `backend/` directory and install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. **Environment Variables:**
   Create a `.env` file in the root directory and add your keys for Twilio, Anthropic, and Supabase.
3. **Database Setup:**
   Apply the SQL schemas in `database/` to your Supabase project.
4. **Run Application:**
   Start the Flask server:
   ```bash
   python app.py
   ```
5. **Expose Localhost:**
   Use Ngrok to expose port 5000 and connect the resulting URL to your Twilio WhatsApp Sandbox webhook.
