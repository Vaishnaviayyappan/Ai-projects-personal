import re
from dataclasses import dataclass

INJECTION_PATTERNS = [
    r"ignore\s+(all|any)?\s*(previous|prior|the)?\s*instructions",
    r"disregard\s+(your|the)\s+(system|previous)\s+prompt",
    r"you are now (a|an) ",
    r"reveal your (system prompt|instructions)",
    r"act as (if you have no|an unrestricted)",
]

HIGH_RISK_KEYWORDS = {
    "self_harm": ["suicide", "kill myself", "hurt myself"],
    "medical_emergency": ["chest pain", "can't breathe", "cannot breathe", "severe bleeding", "overdose"],
    "legal_risk": ["sue", "lawsuit", "lawyer up"],
    "financial_risk": ["wire transfer", "account number", "social security number", "routing number"],
}

HUMAN_REQUEST_KEYWORDS = ["human", "real person", "representative", "agent", "speak to someone", "manager"]


@dataclass
class GuardrailResult:
    should_escalate: bool
    reason: str | None = None
    sanitized_input: str = ""
    injection_detected: bool = False


def detect_prompt_injection(user_input: str) -> bool:
    lowered = user_input.lower()
    return any(re.search(pattern, lowered) for pattern in INJECTION_PATTERNS)


def detect_high_risk(user_input: str) -> str | None:
    lowered = user_input.lower()
    for category, keywords in HIGH_RISK_KEYWORDS.items():
        if any(kw in lowered for kw in keywords):
            return category
    return None


def wants_human(user_input: str) -> bool:
    lowered = user_input.lower()
    return any(kw in lowered for kw in HUMAN_REQUEST_KEYWORDS)


def evaluate(user_input: str, confidence: float, confidence_threshold: float,
             missing_permission: bool = False, tool_failed: bool = False) -> GuardrailResult:
    injection = detect_prompt_injection(user_input)
    sanitized = user_input
    if injection:
        # Strip the injection attempt from what actually reaches the LLM as an instruction;
        # the raw text is still logged for audit purposes by the caller.
        sanitized = "[The user's message contained an attempted instruction override, which was ignored.] " + user_input

    high_risk = detect_high_risk(user_input)
    if high_risk:
        return GuardrailResult(True, f"high_risk:{high_risk}", sanitized, injection)

    if wants_human(user_input):
        return GuardrailResult(True, "user_requested_human", sanitized, injection)

    if missing_permission:
        return GuardrailResult(True, "tool_permission_denied", sanitized, injection)

    if tool_failed:
        return GuardrailResult(True, "tool_execution_failed", sanitized, injection)

    if confidence < confidence_threshold:
        return GuardrailResult(True, "low_confidence", sanitized, injection)

    return GuardrailResult(False, None, sanitized, injection)
