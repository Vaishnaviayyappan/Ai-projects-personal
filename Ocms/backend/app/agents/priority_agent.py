from app.agents.llm_client import get_llm_response
from app.models.domain import ComplaintPriority

class PriorityAgent:
    @staticmethod
    async def predict_priority(text: str, severity_score: int) -> ComplaintPriority:
        system_prompt = """You are an AI Priority Prediction Agent for compliance tracking.
        Given the complaint and severity score (1-5), predict the priority level.
        Return ONLY valid JSON with a single key "priority" and value one of: "low", "medium", "high", "urgent"
        """
        prompt = f"Complaint: {text}\nSeverity Score: {severity_score}"
        
        result = await get_llm_response(
            prompt=prompt,
            response_format="json",
            system_message=system_prompt
        )
        priority_str = result.get("priority", "medium").lower()
        if priority_str in [p.value for p in ComplaintPriority]:
            return ComplaintPriority(priority_str)
        return ComplaintPriority.MEDIUM
