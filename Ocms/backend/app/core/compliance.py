import re
import logging

logger = logging.getLogger("SecurityUtils")

class PIIScrubber:
    """
    PHASE 9 Security & Compliance: PII Scrubbing Engine.
    Masks sensitive data like emails, phone numbers, and potential SSNs.
    """
    EMAIL_REGEX = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    PHONE_REGEX = r'(\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}|\(\d{3}\)\s*\d{3}[-\.\s]??\d{4}|\d{3}[-\.\s]??\d{4})'

    @classmethod
    def scrub(cls, text: str) -> str:
        if not text: return text
        
        # Mask Emails
        text = re.sub(cls.EMAIL_REGEX, "[EMAIL_REDACTED]", text)
        
        # Mask Phone Numbers
        text = re.sub(cls.PHONE_REGEX, "[PHONE_REDACTED]", text)
        
        return text

class RBACMasker:
    """
    Data Masking based on user role.
    Prevent PII leakage to unauthorized personas.
    """
    @classmethod
    def mask_incident(cls, incident: dict, role: str) -> dict:
        masked = incident.copy()
        
        # PII Visibility Logic (Spec Compliance)
        # Reporter identity only visible to Governance & Admin roles
        privileged_governance = ["Compliance Officer", "System Administrator"]
        
        if role not in privileged_governance:
            if "reporter_email" in masked:
                masked["reporter_email"] = "[PROTECTED_IDENTITY]"
            
            # Mask the reporter_id to prevent tracking
            if "reporter_id" in masked:
                masked["reporter_id"] = "ANONYMIZED_USER"
        
        # Scrub descriptions for everyone except specialized investigation roles
        can_see_raw_context = ["Case Handler", "Department Supervisor", "Compliance Officer", "System Administrator", "Escalation Authority"]
        if role not in can_see_raw_context:
            masked["description"] = PIIScrubber.scrub(masked.get("description", ""))
            # Whistleblowers/Reporters should not see internal memos
            if "memos" in masked:
                masked["memos"] = []
            
        return masked
