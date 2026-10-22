from tests.conftest import register_org


def test_register_and_login(client):
    data = register_org(client)
    assert data["role"] == "owner"
    assert data["access_token"]

    login_resp = client.post("/api/auth/login", json={"email": "owner@test.com", "password": "secret123"})
    assert login_resp.status_code == 200
    assert login_resp.json()["organization_id"] == data["organization_id"]


def test_login_wrong_password_rejected(client):
    register_org(client)
    resp = client.post("/api/auth/login", json={"email": "owner@test.com", "password": "wrong-password"})
    assert resp.status_code == 401


def test_login_unknown_email_rejected(client):
    resp = client.post("/api/auth/login", json={"email": "nobody@test.com", "password": "whatever"})
    assert resp.status_code == 401


def test_duplicate_email_rejected(client):
    register_org(client)
    resp = client.post("/api/auth/register", json={
        "organization_name": "Another Co", "industry": "healthcare",
        "email": "owner@test.com", "password": "different123", "full_name": "Someone Else",
    })
    assert resp.status_code == 400


def test_protected_endpoint_requires_token(client):
    resp = client.get("/api/avatars")
    assert resp.status_code == 401
