from agent.prompt import AGENT_PROMPT
from agent.llm import call_llm
from tools.search_tool import search
from tools.calculator_tool import calculate
from memory.memory import Memory
from config.settings import MAX_STEPS

def run_agent(goal):
    memory = Memory()

    for step in range(MAX_STEPS):
        print(f"\n--- Step {step + 1} ---")

        prompt = AGENT_PROMPT.format(
            goal=goal,
            context=memory.get()
        )

        response = call_llm(prompt)
        print(response)

        if "Action:" not in response:
            print("✅ Goal achieved")
            break

        action = response.split("Action:")[1].split("\n")[0].strip()
        action_input = response.split("Action Input:")[1].strip()

        if action.lower() == "search":
            observation = search(action_input)
        elif action.lower() == "calculator":
            observation = calculate(action_input)
        else:
            observation = "Unknown action"

        memory.add(observation)
