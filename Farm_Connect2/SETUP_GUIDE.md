# 🚜 Farm Connect - Setup & Run Guide

**Farm Connect** is a unified, open-source AI platform for modern agriculture. This guide details how to set up the specialized "Local-Only" version of the platform without Docker.

---

## 📋 Prerequisites
Ensure you have the following installed on your Windows machine:
1.  **Python 3.10+**
2.  **Node.js 18+** (LTS) & `npm`
3.  **PostgreSQL** (Local instance running on default port `5432`)
4.  *(Optional)* **Ollama** (for local LLM inference)

---

## 🚀 Quick Start (One-Command)

We have provided a unified batch script to start the entire platform (Backend + Frontend).

```powershell
.\start_platform.bat
```

This script will:
1.  Check for python/node dependencies.
2.  Start the FastAPI backend on `http://localhost:8000`.
3.  Start the Expo frontend on `http://localhost:8081`.

---

## 🛠 Manual Setup

If you prefer to run services individually or need to debug:

### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (if not exists)
echo DATABASE_URL=postgresql://user:password@localhost/farmconnect > .env

# Run Database Migrations
alembic upgrade head

# Start Server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup (Expo)

```bash
cd frontend

# Install dependencies (Legacy peer deps often needed for Expo/RN compatibility)
npm install --legacy-peer-deps

# Start App
npx expo start --clear
```

-   Press `w` to open the **Web** version.
-   Scan the QR code with **Expo Go** on Android/iOS to run the **Mobile** version.

---

## 🧠 AI Configuration

Farm Connect uses a **Multi-Agent System**. By default, it will attempt to connect to a local **Ollama** instance.

1.  Download Ollama from [ollama.com](https://ollama.com/).
2.  Pull the required model:
    ```bash
    ollama pull mistral
    ```
3.  The backend `orchestrator.py` defaults to `localhost:11434`.

---

## 📱 Troubleshooting

-   **"Network Request Failed" on Mobile**:
    -   Open `frontend/constants/Config.js`.
    -   Update `API_URL` to your machine's **Local IP Address** (e.g., `http://192.168.1.5:8000`), NOT `localhost`.
-   **Database Connection Errors**:
    -   Ensure PostgreSQL service is running in `services.msc`.
    -   Verify credentials in `backend/.env`.

---

**Happy Farming! 🌱**
