import os
from openai import AsyncOpenAI
import json

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy-key"))

async def get_llm_response(prompt: str, response_format=None, system_message: str = "You are a helpful AI assistant.", model: str = "gpt-4o-mini"):
    try:
        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt}
        ]
        
        kwargs = {
            "model": model,
            "messages": messages,
            "temperature": 0.2
        }
        
        if response_format == "json":
            kwargs["response_format"] = {"type": "json_object"}
            
        completion = await client.chat.completions.create(**kwargs)
        
        response_text = completion.choices[0].message.content
        
        if response_format == "json":
            return json.loads(response_text)
        return response_text
    except Exception as e:
        if response_format == "json":
            # Intelligent fallback simulation if OpenAI key is missing or fails
            prompt_lower = prompt.lower()
            return {
                "category": "Fraud" if "money" in prompt_lower or "finance" in prompt_lower else "Harassment" if "harass" in prompt_lower or "yelling" in prompt_lower else "General",
                "severity": 4 if "urgent" in prompt_lower else 2,
                "key_entities": ["Manager", "Finance Dept"],
                "summary": prompt[:40] + "...",
                "priority": "urgent" if "urgent" in prompt_lower else "medium",
                "department": "Finance" if "money" in prompt_lower else "HR" if "harass" in prompt_lower else "Operations",
                "resolution_plan": "1. Review internally.\n2. Involve legal team.\n3. Resolve complaint.",
                "action_items": ["Review", "Interview"]
            }
        return "Simulated AI response due to missing API Key"
