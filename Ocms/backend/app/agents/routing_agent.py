from app.agents.llm_client import get_llm_response

class RoutingAgent:
    @staticmethod
    async def route_complaint(category: str, description: str) -> str:
        system_prompt = """You are an autonomous AI Routing Orchestrator.
        Your goal is to inspect the category and description of an employee's complaint and assign it strictly to the most appropriate business unit.
        
        Available Units: ["HR Data/Relations", "Corporate Legal", "IT SecOps", "Internal Audit & Finance", "Global Ethics Board", "General Management"]
        
        Evaluate the context deliberately. 
        If it involves money, expenses, or accounting -> Internal Audit & Finance.
        If it involves interpersonal conflicts, harassment -> HR Data/Relations.
        If it involves potential lawsuits -> Corporate Legal.

        Return ONLY a strictly valid JSON object:
        {
          "department": "exact name from Available Units list"
        }
        """
        prompt = f"Category: {category}\nDescription: {description}"
        
        result = await get_llm_response(
            prompt=prompt,
            response_format="json",
            system_message=system_prompt
        )
        return result.get("department", "General Management")
