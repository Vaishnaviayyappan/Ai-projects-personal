import json
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.agent.tools.base import ToolResult, ToolSpec, registry
from app.models import Avatar

SEED_DIR = Path(__file__).resolve().parent.parent.parent.parent / "seed"

CATALOGS = {
    "marketing": "marketing_products.json",
    "retail": "marketing_products.json",
    "real_estate": "real_estate_properties.json",
}


def _load_catalog(industry: str) -> list[dict[str, Any]]:
    filename = CATALOGS.get(industry)
    if not filename:
        return []
    path = SEED_DIR / filename
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def _score(item: dict[str, Any], budget: float | None, features: list[str], category: str | None) -> int:
    score = 0
    if category and category.lower() in item.get("category", "").lower():
        score += 3
    item_features = [f.lower() for f in item.get("features", [])]
    for f in features:
        if any(f.lower() in feat for feat in item_features):
            score += 2
    if budget:
        if item["price"] <= budget:
            score += 2
        else:
            score -= 3
    return score


def run_product_search(db: Session, org_id: str, avatar_id: str, params: dict[str, Any]) -> ToolResult:
    avatar = db.query(Avatar).filter(Avatar.id == avatar_id).first()
    if not avatar:
        return ToolResult(success=False, error="avatar_not_found")

    catalog = _load_catalog(avatar.industry)
    if not catalog:
        return ToolResult(success=False, error=f"no_catalog_for_industry:{avatar.industry}")

    budget = params.get("budget")
    try:
        budget = float(budget) if budget not in (None, "") else None
    except (TypeError, ValueError):
        budget = None

    features = params.get("features") or []
    if isinstance(features, str):
        features = [f.strip() for f in features.split(",") if f.strip()]
    category = params.get("category")

    scored = [(item, _score(item, budget, features, category)) for item in catalog]
    scored = [pair for pair in scored if pair[0].get("availability") != "sold"]
    scored.sort(key=lambda pair: pair[1], reverse=True)

    top = scored[:5]
    results = []
    for item, score in top:
        reasons = []
        if category and category.lower() in item.get("category", "").lower():
            reasons.append(f"matches category '{category}'")
        matched_features = [f for f in features if any(f.lower() in feat.lower() for feat in item.get("features", []))]
        if matched_features:
            reasons.append(f"matches requested features: {', '.join(matched_features)}")
        if budget and item["price"] <= budget:
            reasons.append(f"within budget of {budget:,.0f}")
        elif budget and item["price"] > budget:
            reasons.append(f"slightly above budget ({item['price']:,.0f} vs {budget:,.0f})")
        results.append({
            **item,
            "recommendation_reason": "; ".join(reasons) if reasons else "general match based on your requirements",
            "match_score": score,
        })

    return ToolResult(success=True, data={"matching_products": results, "count": len(results)})


registry.register(ToolSpec(
    name="product_search",
    description="Search the business catalog (products or properties depending on industry) by category, budget, and desired features",
    parameters={
        "category": "product/property category, e.g. laptop, apartment",
        "budget": "maximum budget as a number",
        "features": "comma separated list of desired features/preferences",
    },
    handler=run_product_search,
))
