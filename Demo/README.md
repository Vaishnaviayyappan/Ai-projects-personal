# Aegis AI — Multi-Industry Agentic AI Avatar Platform

A working MVP of an agentic AI "digital employee" platform: a configurable avatar backed by a real
agent loop (intent detection → knowledge retrieval → tool selection → permission check → tool
execution → grounded response → human escalation), not a single LLM prompt wrapper.

Two industries are seeded end-to-end to prove the platform is reusable, not industry-specific:

- **Marketing** (Aero Retail Co / avatar "Maya") — product search, lead qualification, appointments.
- **Real Estate** (Prime Realty Group / avatar "Leo") — property search, site visit scheduling, leads.

The same backend, agent orchestrator, tool registry, RAG pipeline, and admin dashboard serve both —
only the seeded config (persona, knowledge, catalog) differs. Adding a new industry means creating a
new organization + avatar + knowledge sources through the admin UI, not writing new code.

## What's real vs. scoped down

This is an MVP slice of the full spec, built to actually run rather than to mock everything:

| Area | Status |
|---|---|
| Agent orchestration (intent → RAG → tool → response) | **Real**, multi-step, not a single LLM call |
| RAG pipeline (chunking, embeddings, vector search, source attribution, relevance threshold) | **Real** (ChromaDB + Ollama embeddings) |
| Tools: product/property search, appointment scheduling, CRM lead creation | **Real**, backed by SQLite, with permission checks per avatar |
| Human escalation (triggers, transcript summary, admin resolution queue) | **Real** |
| Multi-tenancy (org-scoped data isolation, JWT auth, RBAC) | **Real** |
| Admin dashboard (avatar config, knowledge mgmt, conversations, analytics, leads, appointments) | **Real** |
| LLM / embeddings | **Local via Ollama** (no API key needed, per project decision) — swappable |
| Voice (STT) | **Browser Web Speech API** — free, no vendor key, works in Chrome |
| Voice (TTS) | **Local, offline, neural** — Piper (`app/tts.py`) generates natural-sounding speech server-side per avatar voice (no API key, CPU-only, ~1-2s/sentence). Browser `SpeechSynthesis` voices the static-avatar fallback. |
| Avatar video (default, open-source) | **Real, self-hosted** — Wav2Lip generates a lip-synced clip in seconds per reply when the avatar has a face photo; visibly blurrier than the SadTalker option below (structural to the model, not a bug) — see [Avatar video](#avatar-video). |
| Avatar video (open-source, opt-in) | **Real, self-hosted, best open-source quality, off by default** — SadTalker generates a talking-head clip with actual head motion + GFPGAN sharpening (verified via frame-by-frame comparison), but takes 10-25+ minutes per clip on this CPU-only machine — too slow to be a sane default, so it requires `ENABLE_SADTALKER=true`. |
| Avatar video (fallback) | **Static CSS-animated portrait**, voiced by the browser's `SpeechSynthesis` API, used automatically when no face photo/checkpoints are configured. |
| 3D avatar preview (opt-in tab) | **Real, client-side WebGL** — a rotatable/interactive Three.js 3D model, entirely separate from the talking-head video above (no GPU/CUDA needed; see [3D avatar preview](#3d-avatar-preview)). |
| Industries beyond Marketing/Real Estate | Architecture supports them (industry is just avatar config + a catalog); only 2 are seeded with demo data |

## Architecture

```
Browser (Next.js)
  ├─ Web Speech API (STT) ──┐
  ├─ Chat UI / Admin UI     │
  └─ SpeechSynthesis (TTS) ◄┘
        │ REST (JSON)
        ▼
FastAPI backend
  ├─ auth (JWT) ─ avatars ─ conversations ─ knowledge ─ tools ─ escalations ─ analytics
  └─ Agent Orchestrator (app/agent/orchestrator.py)
        ├─ guardrails: injection detection, high-risk keywords, human-request detection
        ├─ plan: LLM call → {intent, confidence, tool_call, needs_knowledge_lookup}
        ├─ RAG: ChromaDB vector search over org/avatar-scoped knowledge chunks
        ├─ tool registry: permission-checked execution (product_search, schedule_appointment, create_crm_lead)
        ├─ escalate: if low confidence / high risk / human requested / tool denied or failed
        └─ generate: LLM call grounded in retrieved knowledge + tool result → final reply
        ▼
SQLite (org/user/avatar/conversation/message/knowledge/tool/lead/appointment/escalation/audit)
ChromaDB (persisted vector store, cosine similarity)
Ollama (local LLM + embeddings — llama3.2 + nomic-embed-text by default)
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com) installed and running locally
- ~5GB free disk for the local models
- [ffmpeg](https://ffmpeg.org) on PATH (used by both avatar video paths below to mux audio/video)
- `pip install -r requirements.txt` installs [Piper](https://github.com/rhasspy/piper), a small
  neural TTS model — natural-sounding, fully offline, no API key. Voice models live in
  `backend/piper_voices/` (downloaded separately, see below; ~60MB each)
- Optional, for the open-source Wav2Lip avatar video (default when a face photo is configured):
  ~450MB disk for its model checkpoints, and its own Python venv (CPU-only; no GPU needed, but a
  CUDA GPU makes it much faster). See [Avatar video](#avatar-video) for setup.

## Setup (local, no Docker)

### 1. Pull the local models

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

> `llama3.2` (3B) is the default — it responds in roughly 5-15s per call on a CPU-only machine.
> If you have a GPU or don't mind higher latency, set `OLLAMA_CHAT_MODEL=llama3.1` in `backend/.env`
> for noticeably better reasoning quality (expect 8B-class latency, ~1-2 min per turn on CPU-only).

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
cp .env.example .env

# Piper neural TTS voice models (one per seeded avatar), ~60MB each:
mkdir -p piper_voices
curl -L -o piper_voices/en_US-amy-medium.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx
curl -L -o piper_voices/en_US-amy-medium.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json
curl -L -o piper_voices/en_US-ryan-medium.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx
curl -L -o piper_voices/en_US-ryan-medium.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx.json

python -m seed.seed_db        # creates demo orgs/avatars/knowledge
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`. Interactive API docs: `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Frontend runs at `http://localhost:3000`.

### Demo logins

| Organization | Industry | Avatar | Email | Password |
|---|---|---|---|---|
| Aero Retail Co | Marketing | Maya | marketing@demo.com | Demo@1234 |
| Prime Realty Group | Real Estate | Leo | realty@demo.com | Demo@1234 |

## Setup (Docker)

Ollama must run on the host (it needs direct hardware access), everything else runs in containers:

```bash
ollama pull llama3.2 && ollama pull nomic-embed-text
docker compose up --build
```

Then seed the database once inside the backend container:

```bash
docker compose exec backend python -m seed.seed_db
```

## Trying it end-to-end

1. Open `http://localhost:3000`, click into Maya (Marketing) or Leo (Real Estate).
2. Type e.g. *"I need a laptop for video editing under 80000 rupees"* to Maya — watch it call the
   `product_search` tool (badge shown under the reply) and ground its answer in the seeded catalog.
3. Ask *"What is your return policy?"* — watch the reply cite the seeded FAQ (`Sources: ...` shown
   under the reply), pulled via RAG rather than the model's own guess.
4. Say *"I want to talk to a human"* — watch it escalate instead of answering, and check
   `/admin/escalations` after logging in as `marketing@demo.com`.
5. Ask anything (typed or spoken) — if Wav2Lip/SadTalker is set up (see
   [Avatar video](#avatar-video)), the reply plays back as a real talking-head video clip instead of
   the static portrait. With the default Wav2Lip provider, expect a real few-seconds-to-tens-of-seconds
   wait per reply on a CPU-only machine; if you opt into SadTalker instead, expect 10-25+ minutes.
6. In `/admin`, check the Dashboard (real analytics computed from the DB), Knowledge Base (upload a
   PDF/DOCX/text FAQ), Avatars (toggle tool permissions per avatar, edit persona), Leads/Appointments.

## Avatar video

Three providers, tried in this order (`app/avatar_providers/__init__.py`), each verified working —
entirely open-source, no vendor API key, no GPU required:

1. **SadTalker (open-source, opt-in)** — off by default (`ENABLE_SADTALKER=false`); if turned on and
   the avatar has a face photo, every reply generates a real talking-head clip with actual head motion
   and GFPGAN-sharpened detail — the best open-source visual quality here, at a severe latency cost
   (10-25+ minutes per reply on CPU). Turn on only if you specifically want to see that quality and
   don't mind the wait — see the note below for why it's not a default.
2. **Wav2Lip (open-source, default)** — used automatically when SadTalker isn't enabled, if the
   avatar has a face photo and the Wav2Lip environment is set up: a lip-synced clip in seconds, at a
   real quality cost — see its note below.
3. **Static fallback** — a CSS-animated portrait voiced by the browser's `SpeechSynthesis` API, used
   automatically when neither of the above is configured.

All three activate on every reply, whether you typed or spoke it — the avatar always speaks/animates
its response. The mic button controls speech *input* only (via the browser's Web Speech API); it's
not required to see the avatar respond.

See also [3D avatar preview](#3d-avatar-preview) below — a separate, opt-in tab that renders a
rotatable 3D model instead of a talking-head video clip.

### SadTalker (open-source, opt-in — not the default)

[SadTalker](https://github.com/OpenTalker/SadTalker) generates a talking-head clip per reply with
real head pose/motion and GFPGAN face enhancement, at 256×256 — a real, verified visual quality step
up from Wav2Lip (see the frame-by-frame comparison in the project history: sharp skin/hair detail,
visible head rotation between frames, crisp teeth/lip rendering vs. Wav2Lip's blurry 96×96 patch).
It lives in its own isolated environment (`backend/sadtalker/`), same pattern as Wav2Lip:

```bash
cd backend/sadtalker
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt   # torch/torchvision/basicsr/gfpgan (CPU)
# download checkpoints (all from GitHub Releases, reliable, no Google Drive):
mkdir -p repo/checkpoints repo/gfpgan/weights
curl -L -o repo/checkpoints/SadTalker_V0.0.2_256.safetensors https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/SadTalker_V0.0.2_256.safetensors
curl -L -o repo/checkpoints/mapping_00229-model.pth.tar https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00229-model.pth.tar
curl -L -o repo/checkpoints/mapping_00109-model.pth.tar https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00109-model.pth.tar
curl -L -o repo/gfpgan/weights/GFPGANv1.4.pth https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth
curl -L -o repo/gfpgan/weights/detection_Resnet50_Final.pth https://github.com/xinntao/facexlib/releases/download/v0.1.0/detection_Resnet50_Final.pth
curl -L -o repo/gfpgan/weights/alignment_WFLW_4HG.pth https://github.com/xinntao/facexlib/releases/download/v0.1.0/alignment_WFLW_4HG.pth
curl -L -o repo/gfpgan/weights/parsing_parsenet.pth https://github.com/xinntao/facexlib/releases/download/v0.2.2/parsing_parsenet.pth
```

Getting this actually running required three real fixes, already applied in the vendored copy under
`backend/sadtalker/repo/`, worth knowing about if you re-clone or update it:

- `basicsr/data/degradations.py` imports `rgb_to_grayscale` from the long-removed
  `torchvision.transforms.functional_tensor` — repoint it at `torchvision.transforms.functional`.
- Newer `setuptools` (81+) dropped `pkg_resources`, which `librosa` still imports — pin
  `setuptools<81` in the SadTalker venv.
- `src/utils/videoio.py` invokes `ffmpeg -hide_banner`, a flag this machine's ancient bundled ffmpeg
  build doesn't support, silently breaking the final audio/video mux — drop `-hide_banner` from both
  `ffmpeg` command strings there.

**Why this isn't the default: quality vs. time.** On this CPU-only machine, a short test clip (~4.5s
of audio, 56 rendered frames) took **24.5 minutes** — SadTalker renders every frame through a full
neural face-renderer, not a small patched region like Wav2Lip, so it's roughly 60-100x slower. It was
briefly made the default per an earlier request for maximum open-source quality, but repeatedly read
as "broken" in practice (a static photo for 10-25 minutes looks identical to "no lipsync" to anyone
who hasn't seen the multi-minute wait warning) — so it's opt-in now. Set `ENABLE_SADTALKER=true` in
`backend/.env` if you specifically want to see it. A CUDA GPU would remove nearly all of this latency;
`--extra-index-url https://download.pytorch.org/whl/cu121` (or matching your CUDA version) in
`requirements.txt` is the lever if one becomes available.

**License note:** same caveat as Wav2Lip below — check the upstream repo's license terms for the
pretrained weights before any commercial use.

### Wav2Lip (open-source, fast fallback)

[Wav2Lip](https://github.com/Rudrabha/Wav2Lip) generates a lip-synced video clip per reply — not a
live stream, since there's no GPU on a typical dev machine to run it in real time. It lives in its
own isolated environment (`backend/wav2lip/`) so its old, pinned-looking dependency stack never
touches the main backend's:

```bash
cd backend/wav2lip
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt   # torch/torchvision/opencv/librosa (CPU) + batch-face
bash download_checkpoints.sh                     # ~450MB total; safe to re-run if a download drops
```

Then give an avatar a face photo — either upload one from its admin config page ("Open-source avatar
face photo"), or `POST /api/avatars/{id}/face-image` directly. A clear, front-facing photo works best.
`seed_db.py` gives each demo avatar a real (but synthetic, non-real-person) StyleGAN2 face from
[thispersondoesnotexist.com](https://thispersondoesnotexist.com) automatically, falling back to a
simple flat illustration only if that fetch fails offline — either way, swap in your own photo any
time for a specific look. Once a face photo exists and the checkpoints are present,
`POST /api/avatars/{id}/session` reports `"provider": "wav2lip"` automatically — no restart needed.

Each turn: `app/tts.py` renders the reply to speech with Piper (a small neural TTS model — natural,
not robotic, picking a per-avatar voice via `Avatar.voice_id`; see [Voice (TTS)](#prerequisites)),
`app/avatar_providers/wav2lip.py` shells out to the isolated venv's `inference.py` (RetinaFace face
detection + the Wav2Lip GAN model), and the resulting MP4 is played back as a normal `<video>` element
in `AvatarStage.tsx`. Expect real per-turn latency here — CPU-only inference took roughly 15-25s for a
sentence in testing (plus ~1-2s for Piper); a CUDA GPU would make Wav2Lip dramatically faster (set
`--extra-index-url https://download.pytorch.org/whl/cu121` or similar in `requirements.txt` and torch
will use it automatically).

**License note:** Wav2Lip's own code has no restrictive license, but its pretrained model weights are
released for personal/research/non-commercial use only (see the upstream repo). Fine for this demo;
swap in your own fine-tuned or licensed weights before any commercial use.

**Quality is real but genuinely limited.** Verified via a full frame-by-frame sequence that the mouth
does move correctly with speech rhythm (closed → open with teeth visible → closed), so the mechanism
works — but Wav2Lip generates the mouth region at a fixed 96×96px internally and stretches it back up
to fit the photo, which looks visibly soft/blurry (SadTalker's 256×256 generation looks noticeably
sharper — see above). Neither downscaling the source
photo nor disabling temporal smoothing meaningfully changed this — it's structural to the model, not
a config issue. The docs claim the non-GAN checkpoint (`wav2lip.pth`) has better sync accuracy than
the GAN one used here, but every public mirror checked had it either broken or silently duplicated
from the GAN checkpoint, so that's untested. A stronger open-source alternative (e.g. MuseTalk, which
generates at 256×256) was investigated but not attempted: its dependency stack (`mmcv`/`mmdet`/`mmpose`)
assumes CUDA with no documented CPU path, making it a poor bet without a GPU. If you want the best
open-source quality this repo has and can tolerate the wait, use SadTalker (`ENABLE_SADTALKER=true`)
instead — Wav2Lip is the fast, zero-cost, offline default, not a drop-in quality match for it.

## 3D avatar preview

A separate, opt-in tab on the avatar chat page (`components/Avatar3DPreview.tsx`) renders a
rotatable/interactive 3D model client-side with Three.js — drag to rotate, scroll to zoom, no GPU or
CUDA needed, since it's WebGL rendering of a pre-made model rather than neural photo-to-3D
reconstruction. Every neural photo-to-3D-human model investigated (IDOL, PIFuHD, TripoSR) requires a
CUDA GPU with 6-24GB VRAM, which this machine doesn't have, so this preview intentionally shows a
sample model rather than one generated from the avatar's own photo — it demonstrates the interaction
pattern (a real rotatable 3D avatar in the browser), not a personalized reconstruction.

The current sample model is [CesiumMan](https://github.com/KhronosGroup/glTF-Sample-Assets) (CC-BY
4.0, attribution: © 2017 Cesium). It's stylized rather than photorealistic; a more human-looking
alternative (e.g. a Ready Player Me sample avatar) exists but carries a non-commercial-only license
(CC BY-NC-SA 4.0), so swapping it in is a licensing decision, not just a visual one — see the project
history for the full tradeoff if you want to change it.

## Extending to a new industry

No code changes needed for a new tenant/avatar:

1. Register an organization at `/register` (or via `POST /api/auth/register`) with the new industry.
2. Create an avatar in `/admin/avatars` — persona, greeting, languages, agent instructions.
3. Upload FAQs/policies/product docs in `/admin/knowledge` (PDF, DOCX, or pasted text).
4. Enable the tools that make sense for that avatar in its config page.

Adding a genuinely new *tool* (e.g. a real CRM/calendar API instead of the mock ones here) means
implementing a handler + `ToolSpec` in `backend/app/agent/tools/` and registering it — the
orchestrator, permission system, and UI already generalize over the tool registry.

## Testing

**Backend (unit/integration, fast, mocked LLM):**

```bash
cd backend && pytest
```

**End-to-end (real, live, no mocks)** — drives the actual running app in a real browser: real
LLM planning/generation calls, real RAG retrieval, real tool execution, real Wav2Lip clip
generation, real admin pages. Both servers must already be running against a seeded database
(`npm run dev` / `uvicorn app.main:app`, per [Setup](#setup-local-no-docker)):

```bash
cd frontend
npx playwright install chromium chromium-headless-shell   # one-time
npm run test:e2e            # headless run, list + HTML report
npm run test:e2e:ui         # interactive UI mode, step through each test
npm run test:e2e:report     # open the last HTML report
```

Covers: the landing page's demo-avatar picker, Maya's product-search tool call, RAG-grounded FAQ
answers with cited sources, human escalation, Leo's property search and site-visit scheduling, and
every admin page (dashboard, avatars, knowledge base, conversations, escalations, leads,
appointments). Runs with a single worker (`playwright.config.ts`) on purpose — this machine's
single CPU-only backend process serializes real Wav2Lip/LLM work per request, so parallel test
workers compete for the same CPU and produce spurious timeouts rather than any real speedup.
Expect roughly 5-6 minutes for a full run, dominated by the ~5 chat turns' real latency.

## Environment variables

See `backend/.env.example` and `frontend/.env.local.example` for the full list. Key ones:

- `OLLAMA_CHAT_MODEL` / `OLLAMA_EMBED_MODEL` — swap models or point at a different Ollama host.
- `ENABLE_SADTALKER` — off by default; set to `true` to opt into the best open-source visual quality
  in exchange for a real 10-25+ minute wait per reply. Not recommended unless you specifically want
  to see it.
- `ENABLE_WAV2LIP` — the fast open-source default (used when SadTalker isn't enabled); set to `false`
  to disable even if it's set up.
- `JWT_SECRET` — change this for any non-local deployment.

## Known limitations / what a production build would add next

- SQLite is fine for this MVP; a real deployment should move to PostgreSQL (the SQLAlchemy models
  are already DB-agnostic — just change `DATABASE_URL`).
- No rate limiting or WAF-style input sanitization beyond basic prompt-injection heuristics
  (`app/agent/guardrails.py`) — add a rate limiter (e.g. slowapi) before exposing this publicly.
- Local CPU inference is slow (5-60s/turn depending on model). Swapping the `LLMClient` in
  `app/agent/llm.py` for a hosted API (still fully swappable, same interface) removes this entirely.
- **SadTalker adds 10-25+ minutes of latency per reply on this CPU-only machine** — verified via
  multiple real end-to-end runs, not an estimate. It's off by default (`ENABLE_SADTALKER=false`) for
  exactly this reason; it was briefly the default and repeatedly read as "broken" in practice, since a
  static photo for 10-25 minutes looks identical to a stuck app. Only turn it on if you specifically
  want to see its visual quality and can tolerate the wait — Wav2Lip (default) is the choice for
  anything resembling real-time interaction. A CUDA GPU would remove nearly all of this latency.
- Wav2Lip and SadTalker checkpoint downloads (450MB and ~1.4GB respectively, from HuggingFace/GitHub)
  can be slow or need resuming on a flaky connection — their download scripts are safe to re-run.
- Large ML dependency installs (torch, basicsr, etc.) can fill up disk via pip's wheel cache; if an
  install fails with "No space left on device", `pip cache purge` is a safe, disposable-cache fix
  that doesn't touch any installed packages or project files.
- The seeded demo avatars use a synthetic (non-real-person) StyleGAN2 face fetched at seed time, not
  a photo of an actual person — swap in a real one via the admin UI whenever you want a specific look.
- Only 3 tools and 2 industries are seeded; the registry/permission/UI system generalizes to more.
- Backend unit/integration tests (`cd backend && pytest`) cover auth, tenant isolation, tool logic,
  and guardrails; the Playwright suite (`cd frontend && npm run test:e2e`) covers real end-to-end
  flows against the live app — see [Testing](#testing). Neither does semantic AI-eval (grading
  reply quality/faithfulness against a rubric) — that would be the next real gap to close.
