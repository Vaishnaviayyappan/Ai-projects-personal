from typing import TypedDict, Annotated, Sequence, Union, Dict, Any, List
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END
from app.services.ollama_service import query_ollama
from app.db.session import AsyncSessionLocal
from app.models.features import MarketItem, Scheme
from sqlalchemy.future import select
import logging
import httpx
import datetime
import json

logger = logging.getLogger(__name__)

# Define the state of our agent system
class AgentState(TypedDict):
    messages: Sequence[BaseMessage]
    next_step: str
    user_location: Union[str, None]
    intelligence_gathered: Dict[str, Any]
    steps_taken: List[str]
    user_profile: Dict[str, Any]
    max_loops: int

# --- TOOLS / AGENT SKILLS ---

async def get_weather(location="Punjab"):
    try:
        lat, lon = (30.9, 75.8) if "Punjab" in location else (28.6, 77.2) # Default Punjab/Delhi
        async with httpx.AsyncClient() as client:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,rain&daily=temperature_2m_max,temperature_2m_min&timezone=auto"
            response = await client.get(url, timeout=10.0)
            data = response.json()
            curr = data.get("current", {})
            return f"Weather in {location}: {curr.get('temperature_2m')}°C, Rain: {curr.get('rain')}mm. Forecast: High of {data['daily']['temperature_2m_max'][0]}°C."
    except:
        return "Weather data unavailable."

async def get_market_trends():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(MarketItem))
        items = result.scalars().all()
        # Return structured data for better agentic reasoning
        return [{"label": i.name, "price": i.price, "change": "0.0%"} for i in items]

async def get_schemes():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Scheme).limit(5))
        schemes = result.scalars().all()
        return [f"{s.title}: {s.benefit}" for s in schemes]

# --- AGENT NODES ---

async def thinker_node(state: AgentState):
    """
    Autonomous Reasoning Node: Analyzes the user request and decides what intelligence is needed.
    Optimized for SPEED using Hybrid Logic.
    """
    last_msg = state["messages"][-1].content.lower().strip()
    
    # --- LEVEL 1: ULTRA-FAST KEYWORD ROUTING (0ms) ---
    if len(state.get("steps_taken", [])) == 0:
        if any(word in last_msg for word in ["weather", "rain", "temperature", "forecast", "climate"]):
            return {"next_step": "WEATHER", "steps_taken": ["KWD_WEATHER"]}
        if any(word in last_msg for word in ["price", "mandi", "rate", "market", "cost", "sell", "buy"]):
            return {"next_step": "MARKET", "steps_taken": ["KWD_MARKET"]}
        if any(word in last_msg for word in ["policy", "scheme", "gov", "subsidy", "kisan"]):
            return {"next_step": "POLICY", "steps_taken": ["KWD_POLICY"]}

    # Fast-pass for simple greetings
    if len(last_msg) < 15 or any(word in last_msg for word in ["hi", "hello", "namaste", "hey", "thanks", "ok"]):
        return {"next_step": "FINAL_ANSWER", "steps_taken": state.get("steps_taken", []) + ["GREETING_FAST_PASS"]}

    # --- LEVEL 2: LIGHTWEIGHT AI REASONING (Fast) ---
    intelligence = state.get("intelligence_gathered", {})
    prompt = f"""
    You are an autonomous Farming Intelligence Orchestrator. 
    Farmer asked: "{last_msg}"
    Current Intelligence: {json.dumps(intelligence)}
    Steps Taken: {state.get("steps_taken", [])}
    
    Available Tools: ['WEATHER', 'MARKET', 'POLICY', 'FINAL_ANSWER']
    Respond ONLY with JSON: {{"tool": "TOOL_NAME"}}
    """
    
    try:
        # Use tinyllama with very small token limit for near-instant routing
        raw_res = await query_ollama("tinyllama:latest", prompt, system_prompt="Respond ONLY in JSON.", options={"num_predict": 50})
        
        start = raw_res.find("{")
        end = raw_res.rfind("}")
        if start != -1 and end != -1:
            plan = json.loads(raw_res[start:end+1])
        else:
            plan = {"tool": "FINAL_ANSWER"}
        
        tool = plan.get("tool", "FINAL_ANSWER").upper()
        if tool not in ['WEATHER', 'MARKET', 'POLICY', 'FINAL_ANSWER']:
            tool = "FINAL_ANSWER"

        # Guard against loops
        if len(state.get("steps_taken", [])) >= state.get("max_loops", 3):
            tool = "FINAL_ANSWER"
            
        return {"next_step": tool, "steps_taken": state.get("steps_taken", []) + [tool]}
    except Exception as e:
        logger.error(f"Thinking error: {e}")
        return {"next_step": "FINAL_ANSWER"}

async def weather_worker(state: AgentState):
    logger.info("Agentic Step: Fetching Weather Data")
    data = await get_weather(state.get("user_location", "Punjab"))
    intel = state.get("intelligence_gathered", {})
    intel["weather"] = data
    return {"intelligence_gathered": intel}

async def market_worker(state: AgentState):
    logger.info("Agentic Step: Fetching Market Trends")
    data = await get_market_trends()
    intel = state.get("intelligence_gathered", {})
    # Convert list of dicts to a readable summary for the LLM context if needed, 
    # but keeping it structured in the intel state is better.
    intel["mandi_prices"] = [f"{i['label']}: {i['price']}" for i in data]
    return {"intelligence_gathered": intel}

async def policy_worker(state: AgentState):
    logger.info("Agentic Step: Fetching Govt Policies")
    data = await get_schemes()
    intel = state.get("intelligence_gathered", {})
    intel["gov_schemes"] = data
    return {"intelligence_gathered": intel}

async def synthesis_node(state: AgentState):
    """
    Final answer synthesis.
    """
    last_msg = state["messages"][-1].content
    intel = state.get("intelligence_gathered", {})
    
    prompt = f"""
    You are the FarmConnect AI, an advanced autonomous agricultural agent.
    
    USER PROFILE: {json.dumps(state.get('user_profile', {}))}
    USER QUERY: {last_msg}
    INTELLIGENCE GATHERED: {json.dumps(intel)}
    
    Provide a professional, empathetic, and highly personalized actionable response. 
    Consider the user's location, soil type, and crops.
    Explain your reasoning based on the weather, market, or policy data collected and how it uniquely affects THIS farmer.
    If data is missing, prioritize the safety of the farmer and their crops.
    """
    
    # Use llama3.2 for final synthesis
    response = await query_ollama("llama3.2:latest", prompt, system_prompt="You are an autonomous farm expert.")
    return {"messages": [AIMessage(content=response)], "next_step": END}

# --- GRAPH CONSTRUCTION ---

workflow = StateGraph(AgentState)

workflow.add_node("thinker", thinker_node)
workflow.add_node("weather_agent", weather_worker)
workflow.add_node("market_agent", market_worker)
workflow.add_node("policy_agent", policy_worker)
workflow.add_node("synthesis", synthesis_node)

workflow.set_entry_point("thinker")

# Conditional Routing Logic
def router_logic(state):
    return state["next_step"]

workflow.add_conditional_edges(
    "thinker",
    router_logic,
    {
        "WEATHER": "weather_agent",
        "MARKET": "market_agent",
        "POLICY": "policy_agent",
        "FINAL_ANSWER": "synthesis"
    }
)

# Workers always go back to thinking to see if more is needed
workflow.add_edge("weather_agent", "thinker")
workflow.add_edge("market_agent", "thinker")
workflow.add_edge("policy_agent", "thinker")
workflow.add_edge("synthesis", END)

app = workflow.compile()
