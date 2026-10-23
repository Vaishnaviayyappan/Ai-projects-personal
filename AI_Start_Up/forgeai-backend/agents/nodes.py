import os
from .state import ProjectState
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

load_dotenv()

def get_llm():
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        return ChatOpenAI(model="gpt-4o", temperature=0.7, api_key=api_key)
    
    # Fallback to local Ollama
    try:
        from langchain_ollama import ChatOllama
        return ChatOllama(model="llama3.2", temperature=0.7)
    except ImportError:
        return None

def build_human_message(state: ProjectState) -> str:
    return f"""
IDEA: {state.get("idea", "N/A")}
TARGET USERS: {state.get("target_users", "N/A")}
MARKET: {state.get("market", "N/A")}
BUSINESS MODEL: {state.get("business_model", "N/A")}
RESOURCES: {state.get("team_and_budget", "N/A")}
GOAL: {state.get("startup_goal", "N/A")}
"""

def idea_research_agent(state: ProjectState) -> dict:
    sys_msg = """You are AGENT 1 — IDEA RESEARCH AGENT.
Responsibilities: deeply analyze startup idea, identify industry, niche, TAM/SAM/SOM, emerging trends, timing advantage, AI disruption opportunities.
Deliver:
1. Startup Summary
2. Core Problem
3. Why Existing Solutions Fail
4. Market Gap
5. ICP
6. Monetization Potential
7. Industry Trend Analysis
8. Future Expansion Opportunities
9. Moat Possibilities
10. AI Advantage Analysis
Output format: Markdown report."""
    llm = get_llm()
    if not llm:
        return {"market_research": "Error: No LLM available (OpenAI or Ollama).", "status": "failed"}
        
    response = llm.invoke([SystemMessage(content=sys_msg), HumanMessage(content=build_human_message(state))])
    output = response.content
    return {"market_research": output, "logs": [f"[{state.get('project_id')}] Idea Research Agent completed."], "status": "research_completed"}

def market_validation_agent(state: ProjectState) -> dict:
    sys_msg = """You are AGENT 2 — MARKET VALIDATION AGENT.
Responsibilities: Validate whether people will actually pay. Identify demand signals, search pain points.
Generate:
1. Pain Point Analysis
2. User Personas
3. Existing Workarounds
4. Pricing Expectations
5. Market Urgency Score
6. Validation Score (1–100)
7. PMF Probability
8. Most Profitable Customer Segment
9. Early Adopter Strategy
10. Viral Growth Potential
Also generate survey questions, landing page copy, waitlist strategy."""
    llm = get_llm()
    if not llm:
        return {"validation_analysis": "Error: No LLM available.", "status": "failed"}

    response = llm.invoke([SystemMessage(content=sys_msg), HumanMessage(content=build_human_message(state))])
    output = response.content
    return {"validation_analysis": output, "validation_score": 85, "logs": [f"[{state.get('project_id')}] Market Validation completed."], "status": "validation_completed"}

def competitor_analysis_agent(state: ProjectState) -> dict:
    sys_msg = """You are AGENT 3 — COMPETITOR ANALYSIS AGENT.
Responsibilities: Perform deep competitor intelligence.
Generate:
1. Competitor Comparison Table
2. SWOT Analysis
3. Blue Ocean Opportunities
4. Market Positioning Strategy
5. Recommended Pricing Model
6. Killer Feature Recommendations
7. GTM Differentiation Strategy"""
    llm = get_llm()
    if not llm:
        return {"competitor_analysis": "Error: No LLM available.", "status": "failed"}

    response = llm.invoke([SystemMessage(content=sys_msg), HumanMessage(content=build_human_message(state))])
    output = response.content
    return {"competitor_analysis": output, "logs": [f"[{state.get('project_id')}] Competitor Analysis completed."], "status": "competitor_analysis_completed"}

def product_architect_agent(state: ProjectState) -> dict:
    sys_msg = """You are AGENT 4 — PRODUCT ARCHITECT AGENT.
Responsibilities: Design production-grade SaaS architecture.
Generate: Full PRD, User Flows, Feature Prioritization, MVP Scope, Version Roadmap, Database Schema, API Design, Auth Flow, AI Pipeline, Multi-Tenant, Scalability, Security, DevOps.
Tech Stack: Next.js, Supabase, PostgreSQL, LangGraph, Claude/GPT, Vercel, Stripe, TailwindCSS."""
    llm = get_llm()
    if not llm:
        return {"prd": "Error: No LLM available.", "status": "failed"}

    response = llm.invoke([SystemMessage(content=sys_msg), HumanMessage(content=build_human_message(state))])
    prd_output = response.content
    
    # Generate DB Schema
    schema_response = llm.invoke([
        SystemMessage(content="You are a senior database architect. Generate ONLY the raw SQL schema (PostgreSQL) for the startup idea provided. Use professional naming conventions, relationships, and constraints. No explanations."),
        HumanMessage(content=build_human_message(state))
    ])
    schema_output = schema_response.content.replace("```sql", "").replace("```", "")
    
    return {"prd": prd_output, "generated_db_schema": schema_output, "logs": [f"[{state.get('project_id')}] Product Architecture and Database Schema completed."], "status": "prd_completed"}

def ui_ux_generator_agent(state: ProjectState) -> dict:
    sys_msg = """You are AGENT 5 — UI/UX GENERATOR AGENT.
Responsibilities: Create world-class SaaS UX.
Generate: SaaS dashboard structure, Landing page sections, Wireframe descriptions, Design system, Color palette, Typography, Component hierarchy, Mobile responsiveness, Onboarding, Empty states, AI chat UX.
Style: Modern AI SaaS, Minimal, Premium, Apple + Linear + Notion inspired."""
    llm = get_llm()
    if not llm:
        return {"ui_ux_system": "Error: No LLM available.", "status": "failed"}

    response = llm.invoke([SystemMessage(content=sys_msg), HumanMessage(content=build_human_message(state))])
    output = response.content
    return {"ui_ux_system": output, "logs": [f"[{state.get('project_id')}] UI/UX Generation completed."], "status": "ui_ux_completed"}

def backend_engineering_agent(state: ProjectState) -> dict:
    sys_msg = """You are AGENT 6 — BACKEND ENGINEERING AGENT.
Responsibilities: Generate production-ready engineering plans.
Generate: Backend architecture, API routes, AI orchestration logic, Database queries, Auth implementation, Stripe billing, Queue workers, Background jobs, Webhook handling, Rate limiting, Caching, Error handling."""
    llm = get_llm()
    if not llm:
        return {"backend_architecture": "Error: No LLM available.", "status": "failed"}

    response = llm.invoke([SystemMessage(content=sys_msg), HumanMessage(content=build_human_message(state))])
    arch_output = response.content
    
    # Generate Backend Code
    backend_response = llm.invoke([
        SystemMessage(content="You are a senior Python backend engineer. Write ONLY the raw FastAPI code (main.py) with real Pydantic models and logic for the startup idea provided. No explanations."),
        HumanMessage(content=build_human_message(state))
    ])
    backend_output = backend_response.content.replace("```python", "").replace("```", "")
    
    return {"backend_architecture": arch_output, "generated_backend_code": backend_output, "logs": [f"[{state.get('project_id')}] Backend Engineering and API code completed."], "status": "backend_completed"}

def mvp_generation_agent(state: ProjectState) -> dict:
    llm = get_llm()
    sys_msg = """You are AGENT 7 — MVP GENERATION AGENT.
Responsibilities: Generate actual MVP assets.
Create: Landing page copy, Dashboard copy, Marketing assets, SEO pages, Email sequences, Waitlist funnel, Demo workflow, Feature walkthrough, Launch checklist.
Also generate: README.md, setup instructions, deployment steps."""
    if llm:
        response = llm.invoke([SystemMessage(content=sys_msg), HumanMessage(content=build_human_message(state))])
        output = response.content
    else:
        output = "(Mock) MVP Generation completed."
    
    project_id = state.get("project_id", "default")
    save_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "generated_startups", project_id)
    os.makedirs(save_dir, exist_ok=True)

    if llm:
        code_response = llm.invoke([
            SystemMessage(content="""You are a world-class Senior Product Engineer. Your response must consist ONLY of a single-file raw React code for a 100% Single Page Application (SPA).
            
            CORE REQUIREMENTS:
            1. DO NOT use Next.js routing. Use React state (e.g., [view, setView]) to handle navigation between 'Home', 'Dashboard', 'Features', and 'Pricing'.
            2. DESIGN AESTHETIC: Premium, Dark-mode, Apple/Linear inspired. Use rich gradients, glassmorphism (backdrop-blur), and deep shadows.
            3. DYNAMIC UI: Every element should feel alive. Use Tailwind's 'animate-pulse', 'hover:scale-105', and 'transition-all' extensively.
            4. CONTENT: Include high-fidelity sections (Hero, Feature Grid with icons, Interactive Pricing table, Dashboard mockup with stat cards and a chart using CSS/SVG).
            5. IMPORTS: Use 'lucide-react' for icons. Assume it is available.
            6. CODE STRUCTURE: Start with 'use client'; followed by imports. Ensure all components are in this single file.
            7. NO PLACEHOLDERS: Use real-sounding copy tailored to the startup idea.
            
            FAILURE TO MAKE IT LOOK STUNNING AND DYNAMIC IS UNACCEPTABLE."""),
            HumanMessage(content=build_human_message(state))
        ])
        raw_content = code_response.content.strip()
        
        # Robust extraction: if the model used markdown, take only the content inside
        if "```" in raw_content:
            import re
            code_blocks = re.findall(r"```(?:tsx|jsx|javascript|js)?\n([\s\S]*?)```", raw_content)
            if code_blocks:
                code_output = code_blocks[0].strip()
            else:
                code_output = raw_content.replace("```", "").strip()
        else:
            code_output = raw_content

        # Force 'use client' at the absolute top
        lines = code_output.splitlines()
        # Remove CRA imports and conversational lines
        filtered_lines = [l for l in lines if l.strip() and not (
            l.strip().startswith("import './App.css'") or 
            l.strip().startswith('import "./App.css"') or
            l.strip().startswith("import './index.css'") or
            l.strip().startswith('import "./index.css"')
        )]
        
        # Check if any line starts with use client, if so remove it to avoid duplicates
        final_lines = []
        for l in filtered_lines:
            clean = l.strip().replace("'", "").replace('"', "").replace(";", "")
            if clean == "use client":
                continue
            final_lines.append(l)
            
        code_output = "'use client';\n" + "\n".join(final_lines)
    else:
        # (This block shouldn't be reached now, but keeping for safety)
        code_output = f"'use client';\nexport default function MVP() {{ return <div>{state.get('idea')}</div>; }}"
        
    # Write ALL files to the project directory
    with open(os.path.join(save_dir, "page.tsx"), "w", encoding="utf-8") as f:
        f.write(code_output)
    
    db_schema = state.get("generated_db_schema", "-- No schema generated")
    with open(os.path.join(save_dir, "schema.sql"), "w", encoding="utf-8") as f:
        f.write(db_schema)
        
    backend_code = state.get("generated_backend_code", "# No backend code generated")
    with open(os.path.join(save_dir, "main.py"), "w", encoding="utf-8") as f:
        f.write(backend_code)
        
    with open(os.path.join(save_dir, "PRD.md"), "w", encoding="utf-8") as f:
        f.write(state.get("prd", "No PRD generated"))

    return {"mvp_plan": output, "generated_code_path": save_dir, "logs": [f"[{project_id}] Full Tech Stack (Next.js, FastAPI, SQL) generated and saved to {save_dir}."], "status": "mvp_completed"}

def pitch_deck_agent(state: ProjectState) -> dict:
    sys_msg = """You are AGENT 8 — PITCH DECK AGENT.
Responsibilities: Create investor-grade fundraising materials.
Generate: Problem Slide, Solution, Market Size, Product Demo Narrative, Business Model, Competitive Advantage, Go-To-Market, AI Defensibility, Financial Projections, Vision, Team Story, Funding Ask.
Style: Y Combinator + Sequoia quality."""
    llm = get_llm()
    if not llm:
        return {"pitch_deck": "Error: No LLM available.", "status": "failed"}

    response = llm.invoke([SystemMessage(content=sys_msg), HumanMessage(content=build_human_message(state))])
    output = response.content
    return {"pitch_deck": output, "logs": [f"[{state.get('project_id')}] Pitch Deck completed."], "status": "pitch_deck_completed"}

def investor_outreach_agent(state: ProjectState) -> dict:
    sys_msg = """You are AGENT 9 — INVESTOR OUTREACH AGENT.
Responsibilities: Generate fundraising execution strategy.
Generate: VC target list, Angel categories, Outreach emails, LinkedIn messages, Demo day strategy, Cold outreach, Founder narrative, Fundraising timeline, Investor FAQ, Pitch objections handling."""
    llm = get_llm()
    if not llm:
        return {"investor_outreach": "Error: No LLM available.", "status": "failed"}

    response = llm.invoke([SystemMessage(content=sys_msg), HumanMessage(content=build_human_message(state))])
    output = response.content
    return {"investor_outreach": output, "logs": [f"[{state.get('project_id')}] Investor Outreach completed."], "status": "outreach_completed"}

def growth_and_launch_agent(state: ProjectState) -> dict:
    sys_msg = """You are AGENT 10 — GROWTH & LAUNCH AGENT.
Responsibilities: Create startup growth engine.
Generate: Launch strategy, Product Hunt strategy, SEO strategy, AI content engine, Viral loops, Referral systems, Cold email campaigns, LinkedIn growth, Founder branding, Community growth, Paid ads, Partnerships.
Also generate: 30-day launch plan, 90-day growth roadmap, KPI dashboard."""
    llm = get_llm()
    if not llm:
        return {"launch_strategy": "Error: No LLM available.", "status": "failed"}

    response = llm.invoke([SystemMessage(content=sys_msg), HumanMessage(content=build_human_message(state))])
    output = response.content
    return {"launch_strategy": output, "logs": [f"[{state.get('project_id')}] Growth & Launch Strategy completed."], "status": "launch_ready"}
