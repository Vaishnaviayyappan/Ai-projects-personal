from app.agents.llm_client import get_llm_response
from app.models.domain import ResolutionDraft

class ResolutionAgent:
    @staticmethod
    async def suggest_resolution(complaint_text: str, category: str) -> ResolutionDraft:
        system_prompt = """You are a master compliance Resolution Strategy AI.
        Draft a comprehensive resolution strategy for this complaint.
        
        Guidelines:
        1. "draft_response": An empathetic, legally sound, and concise response to the reporter.
        2. "recommended_actions": Minimum 2 concrete investigative or restorative next steps for the assigned Handler.
        3. "policy_references": Cite at least 1 mock corporate standard (e.g. Employee Handbook Sec 4.2).
        
        Output MUST be valid JSON:
        {
          "draft_response": "...",
          "recommended_actions": ["...", "..."],
          "policy_references": ["..."]
        }
        """
        prompt = f"Category: {category}\nComplaint: {complaint_text}"
        
        result = await get_llm_response(
            prompt=prompt,
            response_format="json",
            system_message=system_prompt
        )
        
        return ResolutionDraft(
            draft_response=result.get("draft_response", "We are looking into your complaint."),
            recommended_actions=result.get("recommended_actions", ["Investigate further"]),
            policy_references=result.get("policy_references", [])
        )
