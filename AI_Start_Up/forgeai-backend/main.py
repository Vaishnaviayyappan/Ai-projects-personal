from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import asyncio
import os
import shutil
from agents.graph import forge_agent_pipeline

app = FastAPI(title="ForgeAI Orchestrator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StartupIdea(BaseModel):
    idea: str
    target_users: str = ""
    market: str = ""
    business_model: str = ""
    team_and_budget: str = ""
    startup_goal: str = ""

class ExecutionResponse(BaseModel):
    project_id: str
    status: str

# In-memory store for runs (replace with Supabase/PostgreSQL in production)
runs = {}

@app.post("/api/orchestrate", response_model=ExecutionResponse)
async def start_orchestration(idea_input: StartupIdea, background_tasks: BackgroundTasks):
    project_id = str(uuid.uuid4())
    runs[project_id] = {
        "status": "initializing", 
        "logs": ["Initializing LangGraph Pipeline..."]
    }
    
    # Trigger the background LangGraph execution
    background_tasks.add_task(run_langgraph_pipeline, project_id, idea_input)
    
    return ExecutionResponse(project_id=project_id, status="started")

@app.get("/api/status/{project_id}")
async def get_status(project_id: str):
    if project_id not in runs:
        return {"error": "Project not found"}
    return runs[project_id]

@app.post("/api/deploy/{project_id}")
async def deploy_project(project_id: str):
    if project_id not in runs:
        return {"error": "Project not found"}
        
    code_path = runs[project_id].get("generated_code_path")
    if not code_path:
        return {"error": "No generated code found for this project."}
        
    source_file = os.path.join(code_path, "page.tsx")
    if not os.path.exists(source_file):
        return {"error": "page.tsx not found in generated code path."}
        
    # Copy to frontend's preview route
    frontend_dir = os.path.abspath(os.path.join(os.getcwd(), "..", "forgeai-frontend"))
    preview_dir = os.path.join(frontend_dir, "src", "app", "preview")
    os.makedirs(preview_dir, exist_ok=True)
    
    shutil.copy(source_file, os.path.join(preview_dir, "page.tsx"))
    
    # Return the local URL instantly without using LocalTunnel to avoid all network errors, 
    # warning screens, and pop-up blocking timeouts.
    return {"url": "http://localhost:3000/preview"}

class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        import httpx
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post("http://localhost:11434/api/generate", json={
                "model": "llama3.2",
                "prompt": request.message,
                "stream": False
            })
        if response.status_code == 200:
            return {"response": response.json().get("response", "No response generated.")}
        return {"error": "Failed to connect to local AI."}
    except Exception as e:
        return {"error": str(e)}

async def run_langgraph_pipeline(project_id: str, idea_input: StartupIdea):
    """Executes the LangGraph pipeline."""
    initial_state = {
        "project_id": project_id,
        "idea": idea_input.idea,
        "target_users": idea_input.target_users,
        "market": idea_input.market,
        "business_model": idea_input.business_model,
        "team_and_budget": idea_input.team_and_budget,
        "startup_goal": idea_input.startup_goal,
        "logs": ["Starting execution..."],
        "status": "running"
    }
    
    try:
        runs[project_id]["logs"].append("Pipeline thread started. Preparing agents...")
        # We simulate asynchronous streaming of the graph states
        # The .stream() method returns states as nodes finish
        async for output in forge_agent_pipeline.astream(initial_state):
            # output is a dict where key is the Node name and value is the state update
            for node_name, state_update in output.items():
                runs[project_id]["status"] = state_update.get("status", f"running {node_name}")
                if "logs" in state_update:
                    runs[project_id]["logs"].extend(state_update["logs"])
                if "prd" in state_update:
                    runs[project_id]["prd"] = state_update["prd"]
                if "generated_code_path" in state_update:
                    runs[project_id]["generated_code_path"] = state_update["generated_code_path"]
                    
            await asyncio.sleep(1) # Simulate real-time delay
            
        runs[project_id]["status"] = "completed"
        runs[project_id]["logs"].append("✨ Pipeline Execution Finished. Assets ready.")
        
    except Exception as e:
        runs[project_id]["status"] = "failed"
        runs[project_id]["logs"].append(f"❌ Error during execution: {str(e)}")
