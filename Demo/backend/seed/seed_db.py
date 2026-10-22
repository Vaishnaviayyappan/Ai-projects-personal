"""Populate the database with demo tenants, avatars, tool configs, and knowledge sources.

Run from backend/: python -m seed.seed_db
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import shutil  # noqa: E402
from app.avatar_providers import FACES_DIR  # noqa: E402
from app.agent import rag  # noqa: E402
from app.agent.tools import registry  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.models import (  # noqa: E402
    Avatar, KnowledgeSource, Organization, ToolConfiguration, User, UserRole,
)
from app.security import hash_password  # noqa: E402

MARKETING_FAQ = """
Aero Retail Co - Frequently Asked Questions

Q: What is your return policy?
A: All laptops and electronics can be returned within 15 days of delivery if unused and in original packaging. Refunds are processed within 5-7 business days.

Q: Do you offer EMI/installment payment options?
A: Yes, we offer no-cost EMI on all purchases above 20,000 through partner banks, for tenures of 3, 6, 9, or 12 months.

Q: What warranty do your laptops come with?
A: All AeroBook laptops come with a standard 1-year manufacturer warranty covering hardware defects. Extended 2-year and 3-year warranty plans are available at checkout.

Q: Do you offer student discounts?
A: Yes, students with a valid student ID get 5% off AeroBook Air and AeroBook Mini models.

Q: How long does delivery take?
A: Standard delivery takes 3-5 business days. Express delivery (1-2 business days) is available in major cities for an additional fee.

Q: Can I upgrade RAM or storage after purchase?
A: AeroBook Pro Creator, Studio, and Ultra Creator models have upgradeable RAM and storage. Air and Mini models have soldered components and cannot be upgraded.

Q: Do you provide corporate/bulk purchase discounts?
A: Yes, orders of 10 or more units qualify for corporate pricing. Please share your requirements and our sales team will follow up with a quote.
"""

REAL_ESTATE_FAQ = """
Prime Realty Group - Frequently Asked Questions

Q: What documents are required to book a property?
A: Buyers need a government-issued ID, PAN card, proof of address, and income proof (salary slips or IT returns for the last 2 years) to proceed with booking.

Q: Is home loan assistance available?
A: Yes, we have tie-ups with 8 major banks and can assist with home loan pre-approval, typically processed within 7-10 working days.

Q: What is the booking amount required?
A: A booking amount of 10% of the property value is required to reserve a unit, fully adjustable against the final purchase price.

Q: Are the listed prices negotiable?
A: Prices for ready-to-move-in units are generally fixed. Under-construction properties may have limited negotiation room depending on the payment plan chosen.

Q: Do you assist with property registration?
A: Yes, our legal team assists with the full registration process including stamp duty calculation and document verification, for a nominal service fee.

Q: What amenities are typically included in gated communities?
A: Most of our gated community apartments include a clubhouse, swimming pool, gym, children's play area, 24/7 security, and power backup.

Q: Can I schedule a site visit before booking?
A: Absolutely. We encourage all buyers to schedule a free site visit. Visits can be scheduled any day of the week between 9 AM and 6 PM.
"""


def get_or_create_org(db, name: str, slug: str, industry: str) -> Organization:
    org = db.query(Organization).filter(Organization.slug == slug).first()
    if org:
        return org
    org = Organization(name=name, slug=slug, industry=industry)
    db.add(org)
    db.flush()
    return org


def get_or_create_user(db, org: Organization, email: str, password: str, full_name: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user
    user = User(organization_id=org.id, email=email, hashed_password=hash_password(password),
                full_name=full_name, role=UserRole.OWNER)
    db.add(user)
    db.flush()
    return user


def get_or_create_avatar(db, org: Organization, **kwargs) -> Avatar:
    avatar = db.query(Avatar).filter(Avatar.organization_id == org.id, Avatar.name == kwargs["name"]).first()
    if avatar:
        return avatar
    avatar = Avatar(organization_id=org.id, **kwargs)
    db.add(avatar)
    db.flush()
    for spec in registry.all():
        db.add(ToolConfiguration(organization_id=org.id, avatar_id=avatar.id, tool_name=spec.name, is_enabled=True))
    return avatar


def assign_placeholder_face(db, avatar: Avatar) -> None:
    """Gives the avatar a face photo for the open-source Wav2Lip provider, if it doesn't
    already have one. Tries to fetch a real (but synthetic, non-real-person) StyleGAN2 face
    from thispersondoesnotexist.com for a realistic result; falls back to a simple flat
    illustration (still detectable by Wav2Lip's face detector, just not realistic-looking)
    if offline."""
    if avatar.face_image_path:
        return

    FACES_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{avatar.id}.jpg"
    dest = FACES_DIR / filename

    try:
        import httpx
        resp = httpx.get(
            "https://thispersondoesnotexist.com/random-person.jpeg",
            headers={"User-Agent": "Mozilla/5.0"}, timeout=10, follow_redirects=True,
        )
        resp.raise_for_status()
        dest.write_bytes(resp.content)
    except Exception:
        source = FACES_DIR / "test_face.jpg"
        if not source.exists():
            return
        shutil.copyfile(source, dest)

    avatar.face_image_path = filename
    db.add(avatar)


def ingest_faq(db, org: Organization, avatar: Avatar, name: str, text: str) -> None:
    existing = db.query(KnowledgeSource).filter(
        KnowledgeSource.organization_id == org.id, KnowledgeSource.name == name
    ).first()
    if existing:
        return
    source = KnowledgeSource(organization_id=org.id, avatar_id=avatar.id, name=name, source_type="faq",
                              status="processing", raw_text=text)
    db.add(source)
    db.flush()
    chunks = rag.chunk_text(text)
    rag.index_chunks(org.id, avatar.id, source.id, name, chunks)
    source.status = "ready"
    source.chunk_count = len(chunks)


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        marketing_org = get_or_create_org(db, "Aero Retail Co", "aero-retail-co", "marketing")
        get_or_create_user(db, marketing_org, "marketing@demo.com", "Demo@1234", "Marketing Admin")
        maya = get_or_create_avatar(
            db, marketing_org,
            name="Maya", industry="marketing", role="Marketing Sales Consultant",
            appearance_image_url="/avatars/maya.png", voice_id="maya-en-female",
            personality="Friendly, confident, professional",
            speaking_style="conversational", languages=["en", "hi", "ta"],
            greeting="Hi, I'm Maya from Aero Retail! Looking for a new laptop, phone, or accessory today?",
            system_instructions="Recommend products from the catalog via the product_search tool. Qualify leads before creating a CRM entry.",
        )
        assign_placeholder_face(db, maya)
        ingest_faq(db, marketing_org, maya, "Aero Retail FAQ", MARKETING_FAQ)

        realty_org = get_or_create_org(db, "Prime Realty Group", "prime-realty-group", "real_estate")
        get_or_create_user(db, realty_org, "realty@demo.com", "Demo@1234", "Realty Admin")
        leo = get_or_create_avatar(
            db, realty_org,
            name="Leo", industry="real_estate", role="Real Estate Advisor",
            appearance_image_url="/avatars/leo.png", voice_id="leo-en-male",
            personality="Warm, knowledgeable, trustworthy",
            speaking_style="conversational", languages=["en", "hi"],
            greeting="Hello! I'm Leo from Prime Realty. Tell me what kind of property you're looking for.",
            system_instructions="Use the product_search tool to find matching properties. Offer to schedule a site visit once the buyer shows interest.",
        )
        assign_placeholder_face(db, leo)
        ingest_faq(db, realty_org, leo, "Prime Realty FAQ", REAL_ESTATE_FAQ)

        db.commit()
        print("Seed complete.")
        print(f"  Marketing org login: marketing@demo.com / Demo@1234  (avatar: Maya, id={maya.id})")
        print(f"  Real estate org login: realty@demo.com / Demo@1234  (avatar: Leo, id={leo.id})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
