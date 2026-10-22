from app.agents.llm_client import get_llm_response
from typing import Dict, Any

class IntakeAgent:
    @staticmethod
    async def analyze_complaint(text: str) -> Dict[str, Any]:
        system_prompt = """You are an elite AI Complaint Intake Analyst for a highly secure enterprise compliance tracker.
        Analyze the raw complaint text closely using a Chain-of-Thought approach before deciding.
        Your goals are:
        1. Extract the "category" accurately (e.g. Harassment, Financial Fraud, Ethics Violation, Discrimination, Security/IT).
        2. Assign a "severity" score strictly from 1 (lowest risk) to 5 (extreme risk/critical). Be analytical.
        3. Identify "key_entities" (people, titles, exact departments).
        4. Provide a punchy, 10-word max "summary".

        You MUST return ONLY a strictly valid JSON object matching exactly this schema and nothing else:
        {
           "category": "string",
           "severity": int,
           "key_entities": ["string", "string"],
           "summary": "string"
        }
        """
        
        result = await get_llm_response(
            prompt=text,
            response_format="json",
            system_message=system_prompt
        )
        return result
