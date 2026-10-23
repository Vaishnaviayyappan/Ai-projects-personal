# ForgeAI

Turns a startup idea into market research, a PRD, a DB schema, backend code, a React MVP page, a pitch deck and a launch plan, using a 10-agent LangGraph pipeline.

- `forgeai-backend/` — FastAPI + LangGraph (port 8000)
- `forgeai-frontend/` — Next.js 16 UI (port 3000)

## Prerequisites

| Tool | Version tested |
|---|---|
| Python | 3.10+ |
| Node.js | 20+ (tested on 24) |
| [Ollama](https://ollama.com/download) | any recent, with `llama3.2` pulled |

```bash
ollama pull llama3.2
```

Alternatively, set `OPENAI_API_KEY` in `forgeai-backend/.env` to use OpenAI gpt-4o instead of Ollama.

## Setup

### 1. Backend

```bash
cd forgeai-backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env        # Windows: copy .env.example .env
uvicorn main:app --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend (new terminal)

```bash
cd forgeai-frontend
npm ci
npm run dev
```

Open http://localhost:3000.

## Notes

- A full pipeline run makes ~13 LLM calls; on local llama3.2 it takes roughly 15–25 minutes depending on hardware.
- Run state is held in memory and is lost when the backend restarts.
- Generated output is written to `forgeai-backend/generated_startups/<project_id>/`.
- "Deploy" copies the generated `page.tsx` to `forgeai-frontend/src/app/preview/` and serves it at http://localhost:3000/preview.
- The frontend expects the backend at `http://localhost:8000`, and the backend only allows CORS from `http://localhost:3000`.
