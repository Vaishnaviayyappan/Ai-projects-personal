from tests.conftest import auth_headers, register_org


def create_avatar(client, token, name="Maya", industry="marketing"):
    resp = client.post("/api/avatars", json={
        "name": name, "industry": industry, "role": "Sales Consultant",
        "greeting": "Hi there!",
    }, headers=auth_headers(token))
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_create_and_list_avatar(client):
    org = register_org(client)
    avatar = create_avatar(client, org["access_token"])
    assert avatar["organization_id"] == org["organization_id"]

    listing = client.get("/api/avatars", headers=auth_headers(org["access_token"]))
    assert listing.status_code == 200
    assert len(listing.json()) == 1


def test_tenant_isolation_between_organizations(client):
    org_a = register_org(client, email="a@test.com", org_name="Org A")
    org_b = register_org(client, email="b@test.com", org_name="Org B")

    avatar_a = create_avatar(client, org_a["access_token"], name="Maya")

    # Org B should not see Org A's avatar in its listing...
    listing_b = client.get("/api/avatars", headers=auth_headers(org_b["access_token"]))
    assert listing_b.json() == []

    # ...nor be able to fetch it directly, nor update or delete it.
    get_resp = client.get(f"/api/avatars/{avatar_a['id']}", headers=auth_headers(org_b["access_token"]))
    assert get_resp.status_code == 404

    update_resp = client.put(f"/api/avatars/{avatar_a['id']}", json={"name": "Hijacked"},
                              headers=auth_headers(org_b["access_token"]))
    assert update_resp.status_code == 404

    delete_resp = client.delete(f"/api/avatars/{avatar_a['id']}", headers=auth_headers(org_b["access_token"]))
    assert delete_resp.status_code == 404


def test_avatar_creation_auto_registers_tool_configs(client):
    org = register_org(client)
    avatar = create_avatar(client, org["access_token"])

    tools_resp = client.get(f"/api/avatars/{avatar['id']}/tools", headers=auth_headers(org["access_token"]))
    assert tools_resp.status_code == 200
    tool_names = {t["tool_name"] for t in tools_resp.json()}
    assert {"product_search", "schedule_appointment", "create_crm_lead"} <= tool_names
    assert all(t["is_enabled"] for t in tools_resp.json())


def test_disabling_a_tool_persists(client):
    org = register_org(client)
    avatar = create_avatar(client, org["access_token"])

    resp = client.put(f"/api/avatars/{avatar['id']}/tools/product_search", json={"is_enabled": False},
                       headers=auth_headers(org["access_token"]))
    assert resp.status_code == 200
    assert resp.json()["is_enabled"] is False

    tools_resp = client.get(f"/api/avatars/{avatar['id']}/tools", headers=auth_headers(org["access_token"]))
    product_search_cfg = next(t for t in tools_resp.json() if t["tool_name"] == "product_search")
    assert product_search_cfg["is_enabled"] is False
