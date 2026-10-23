from typing import TypedDict, List
import operator
from typing_extensions import Annotated

class ProjectState(TypedDict):
    # Inputs
    project_id: str
    idea: str
    target_users: str
    market: str
    business_model: str
    team_and_budget: str
    startup_goal: str
    
    # Agent Outputs
    market_research: str
    validation_analysis: str
    validation_score: int
    competitor_analysis: str
    prd: str
    ui_ux_system: str
    backend_architecture: str
    mvp_plan: str
    generated_code_path: str
    generated_backend_code: str
    generated_db_schema: str
    pitch_deck: str
    investor_outreach: str
    launch_strategy: str
    
    # Logging mechanism
    logs: Annotated[List[str], operator.add]
    status: str
