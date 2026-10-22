from app.agent.tools.appointment import run_appointment
from app.agent.tools.crm_lead import run_crm_lead
from app.agent.tools.product_search import run_product_search
from app.models import Avatar, Organization


def make_org_and_avatar(db_session, industry="marketing"):
    org = Organization(name="Test Co", slug=f"test-co-{industry}", industry=industry)
    db_session.add(org)
    db_session.flush()
    avatar = Avatar(organization_id=org.id, name="Maya", industry=industry, role="Sales Consultant")
    db_session.add(avatar)
    db_session.commit()
    return org, avatar


def test_product_search_filters_by_budget_and_features(db_session):
    org, avatar = make_org_and_avatar(db_session, industry="marketing")

    result = run_product_search(db_session, org.id, avatar.id, {
        "category": "laptop", "budget": 80000, "features": "video editing",
    })
    assert result.success
    products = result.data["matching_products"]
    assert len(products) > 0
    # Every returned product should either fit the budget or be clearly flagged as over it.
    for p in products:
        assert p["price"] <= 80000 or "above budget" in p["recommendation_reason"]
    # Top match should be the best fit: a laptop with video editing features.
    assert "video editing" in products[0]["features"]


def test_product_search_unknown_industry_fails_gracefully(db_session):
    org, avatar = make_org_and_avatar(db_session, industry="legal_services")
    result = run_product_search(db_session, org.id, avatar.id, {"category": "anything"})
    assert not result.success
    assert "no_catalog_for_industry" in result.error


def test_crm_lead_creation_and_scoring_thresholds(db_session):
    org, avatar = make_org_and_avatar(db_session)

    high_score = run_crm_lead(db_session, org.id, avatar.id, {
        "name": "Jane Doe", "contact": "jane@example.com", "requirements": "laptop for editing",
        "lead_score": 85,
    })
    assert high_score.success
    assert high_score.data["status"] == "qualified"

    low_score = run_crm_lead(db_session, org.id, avatar.id, {
        "name": "John Doe", "contact": "john@example.com", "lead_score": 20,
    })
    assert low_score.data["status"] == "new"


def test_crm_lead_score_is_clamped_to_valid_range(db_session):
    org, avatar = make_org_and_avatar(db_session)
    result = run_crm_lead(db_session, org.id, avatar.id, {"lead_score": 500})
    assert result.data["lead_score"] == 100


def test_appointment_requires_a_date(db_session):
    org, avatar = make_org_and_avatar(db_session)
    result = run_appointment(db_session, org.id, avatar.id, {"customer": "Jane"})
    assert not result.success
    assert result.error == "preferred_date_required"


def test_appointment_creates_confirmed_booking(db_session):
    org, avatar = make_org_and_avatar(db_session)
    result = run_appointment(db_session, org.id, avatar.id, {
        "customer": "Jane", "service": "product demo", "preferred_date": "2026-10-01", "preferred_time": "3pm",
    })
    assert result.success
    assert result.data["status"] == "confirmed"
    assert "2026-10-01" in result.data["confirmed_time"]
