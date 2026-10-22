# 🏗 Farm Connect - System Architecture

## 🔭 Overview
Farm Connect employs a **Unified Cross-Platform Monorepo** strategy. A single frontend codebase serves both Web and Mobile users, checking platform-specific logic only when necessary. The backend is a **Micro-Service inspired Monolith** built with FastAPI, utilizing **LangGraph** for multi-agent coordination.

---

## 🧩 High-Level Design

```mermaid
graph TD
    User[USER] --> |Request| LB[Load Balancer / Gateway]
    
    subgraph "Frontend Layer (Expo Router)"
        Web[Web App (React DOM)]
        Mobile[Mobile App (React Native)]
        Shared[Shared Components & State]
    end
    
    User --> Web
    User --> Mobile
    
    subgraph "Backend Layer (FastAPI)"
        API[API Gateway]
        Auth[Auth Service (JWT)]
        
        subgraph "AI Core (LangGraph)"
            Orchestrator[Agent Orchestrator]
            Distress[Distress Agent]
            Market[Market Agent]
            Weather[Weather Agent]
            Expert[Expert Agent]
        end
        
        DB[(PostgreSQL)]
        Cache[(Redis)]
        LLM[Local LLM (Ollama)]
    end
    
    Web --> |REST / WebSocket| API
    Mobile --> |REST / WebSocket| API
    
    API --> Auth
    API --> Orchestrator
    API --> DB
    
    Orchestrator --> Distress
    Orchestrator --> Market
    Orchestrator --> Weather
    Orchestrator --> Expert
    
    Distress --> LLM
    Market --> LLM
    
    Weather --> |External API| OpenMeteo
```

---

## 💡 Key Design Decisions

### 1. The "Unified Frontend" Strategy
Instead of maintaining `web/` and `mobile/` folders, we use **Expo Router** (file-based routing).
-   `app/index.js`: Acts as the Landing Page (Web) and Welcome Screen (Mobile).
-   `components/AppHeader.js`: Adapts layout. On Desktop, it shows a full navbar. On Mobile, it collapses into a header/drawer.
-   **NativeWind**: Allows us to use `className="flex-1 bg-white"` which compiles to CSS on Web and Native StyleSheets on Mobile.

### 2. Multi-Agent Orchestration
We use **LangGraph** to manage stateful conversations.
-   **Input**: "My wheat has weird yellow spots."
-   **Orchestrator**: Detects intent -> `CROP_HEALTH`.
-   **Routing**: Sends state to `CropHealthAgent`.
-   **Execution**: Agent analyzes image/text -> Returns diagnosis.
-   **Output**: JSON response with `action: "SHOW_ALERT"`.

### 3. Local-First AI
To ensure privacy and reduce costs:
-   All inference runs on **Ollama** (via localhost).
-   Embeddings are stored in **ChromaDB** (local file).
-   No data leaves the farmer's local network (if deployed on-prem) or the regional server.

---

## 📦 Data Schema (Simplified)

### `users`
-   `id` (UUID)
-   `role` (enum: farmer, buyer, expert)
-   `location_lat`, `location_long`

### `farms`
-   `id` (UUID)
-   `user_id` (FK)
-   `crop_type` (Wheat, Rice, etc.)
-   `sowing_date`

### `market_listings`
-   `id` (UUID)
-   `seller_id` (FK)
-   `commodity`
-   `price_per_quintal`
-   `status` (Active, Sold)

### `conversations`
-   `id` (UUID)
-   `agent_type`
-   `message_history` (JSONB)
