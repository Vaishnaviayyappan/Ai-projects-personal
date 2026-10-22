# Farm Connect 🚜🌾
> AI-Powered Multi-Agent Platform for Smart Agriculture

**Farm Connect** is a production-grade, cross-platform application (Web & Mobile) designed to empower farmers with real-time AI agents, market access, and distress support.

## 🌟 Key Features
- **⚠️ Distress Signal Agent**: Immediate emergency support routing.
- **🤖 Multi-Agent AI System**: Powered by local LLMs (Ollama) & LangGraph.
- **📱 Unified Cross-Platform UI**: Runs natively on Android/iOS and Web from a single codebase.
- **🎨 Nature-Inspired Design**: Premium aesthetics with smooth motion (Reanimated/NativeWind).
- **🔒 Local-First**: Full functionality without cloud dependencies (Local Postgres, Redis, LLaMA).

## 🛠️ Tech Stack
- **Backend**: Python, FastAPI, LangGraph, SQLAlchemy, PostgreSQL, Ollama.
- **Frontend**: React Native, Expo (Web + Mobile), NativeWind, Reanimated.
- **Agents**: Custom LangGraph workflow with specialized nodes (Crop Health, Market, Weather).

## 🚀 Quick Start (Local)

### Prerequisites
- Python 3.9+
- Node.js & npm
- PostgreSQL & Redis (Locally running)
- Ollama (running with `ollama serve`)

### Setup
Double-click `setup_project.bat` to install all dependencies and initialize the database.

### Run
Double-click `start_platform.bat` to launch:
1.  **Backend API**: http://localhost:8000/docs
2.  **Web App**: http://localhost:8081
3.  **Mobile**: Scan QR code with Expo Go.

## 📂 Project Structure
- `/backend`: FastAPI application & Agent logic.
- `/frontend`: Expo React Native application.

---
*Built for the Future of Farming.*
