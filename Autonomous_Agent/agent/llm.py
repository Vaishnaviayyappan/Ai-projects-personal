import openai
import os
from dotenv import load_dotenv
from config.settings import MODEL_NAME

load_dotenv()
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Mock responses for demonstration
mock_responses = [
    "Thought: I need to find the GDP of India first.\nAction: search\nAction Input: GDP of India",
    "Thought: The GDP is approximately $3.7 trillion. Now I need to calculate 10% of it.\nAction: calculator\nAction Input: 3.7 * 0.1",
    "Thought: 10% of $3.7 trillion is $0.37 trillion.\nFinal Answer: $0.37 trillion"
]
call_count = 0

def call_llm(prompt):
    global call_count
    if call_count < len(mock_responses):
        response = mock_responses[call_count]
        call_count += 1
        return response
    else:
        return "Final Answer: Task completed"

# Original code commented out for mock
# def call_llm(prompt):
#     response = client.chat.completions.create(
#         model=MODEL_NAME,
#         messages=[{"role": "user", "content": prompt}],
#         temperature=0
#     )
#     return response.choices[0].message.content
