# AI-Powered Compliance Platform

## Architecture

* **Backend**: Python, FastAPI, Motor (async MongoDB), AsyncOpenAI wrapper for Agents.
* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts.

## Setup Instructions

### 1. Backend

```bash
cd backend
python -m venv venv
# Activate the environment
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install fastapi uvicorn motor openai anthropic pydantic[email] python-multipart websockets
```

Set your environment variables, e.g., in a `.env` file or terminal:
```bash
$env:OPENAI_API_KEY="your-key-here"
```

Start the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173`. You will be directed to the modern SaaS login page. Use any credentials to test the prototype (it's hardcoded to forward to `/report` for demonstration). 

### Multi-Agent System Modules
- **Intake Agent**: Parses raw complaint into severity/categories.
- **Priority Agent**: Assesses the predicted priority rating.
- **Routing Agent**: Assesses the appropriate department routing.
- **Resolution Agent**: Drafts potential resolutions asynchronously.

Everything has been generated in a highly scalable and decoupled architecture!
