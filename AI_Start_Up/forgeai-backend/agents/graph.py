from langgraph.graph import StateGraph, START, END
from .state import ProjectState
from .nodes import (
    idea_research_agent,
    market_validation_agent,
    competitor_analysis_agent,
    product_architect_agent,
    ui_ux_generator_agent,
    backend_engineering_agent,
    mvp_generation_agent,
    pitch_deck_agent,
    investor_outreach_agent,
    growth_and_launch_agent
)

def build_graph():
    # Initialize the state graph
    builder = StateGraph(ProjectState)

    # Add Nodes (The specialized agents)
    builder.add_node("IdeaResearch", idea_research_agent)
    builder.add_node("MarketValidation", market_validation_agent)
    builder.add_node("CompetitorAnalysis", competitor_analysis_agent)
    builder.add_node("ProductArchitect", product_architect_agent)
    builder.add_node("UIUXGenerator", ui_ux_generator_agent)
    builder.add_node("BackendEngineering", backend_engineering_agent)
    builder.add_node("MVPGeneration", mvp_generation_agent)
    builder.add_node("PitchDeck", pitch_deck_agent)
    builder.add_node("InvestorOutreach", investor_outreach_agent)
    builder.add_node("GrowthAndLaunch", growth_and_launch_agent)

    # Define Edges (The execution pipeline)
    builder.add_edge(START, "IdeaResearch")
    builder.add_edge("IdeaResearch", "MarketValidation")
    builder.add_edge("MarketValidation", "CompetitorAnalysis")
    builder.add_edge("CompetitorAnalysis", "ProductArchitect")
    
    builder.add_edge("ProductArchitect", "UIUXGenerator")
    builder.add_edge("UIUXGenerator", "BackendEngineering")
    builder.add_edge("BackendEngineering", "MVPGeneration")
    builder.add_edge("MVPGeneration", "PitchDeck")
    builder.add_edge("PitchDeck", "InvestorOutreach")
    builder.add_edge("InvestorOutreach", "GrowthAndLaunch")
    builder.add_edge("GrowthAndLaunch", END)

    # Compile the graph
    graph = builder.compile()
    return graph

# Instantiate the graph
forge_agent_pipeline = build_graph()
