import { APIRequestContext } from "@playwright/test";

export const API_BASE = "http://localhost:8000";

export interface DemoAvatar {
  id: string;
  name: string;
  industry: string;
}

export async function getDemoAvatars(request: APIRequestContext): Promise<DemoAvatar[]> {
  const res = await request.get(`${API_BASE}/api/avatars/demo`);
  if (!res.ok()) throw new Error(`GET /api/avatars/demo failed: ${res.status()}`);
  return res.json();
}

export async function getDemoAvatar(request: APIRequestContext, name: "Maya" | "Leo"): Promise<DemoAvatar> {
  const avatars = await getDemoAvatars(request);
  const avatar = avatars.find((a) => a.name === name);
  if (!avatar) throw new Error(`Seeded demo avatar "${name}" not found -- has the DB been seeded?`);
  return avatar;
}

export async function loginAndGetToken(
  request: APIRequestContext, email: string, password: string
): Promise<string> {
  const res = await request.post(`${API_BASE}/api/auth/login`, { data: { email, password } });
  if (!res.ok()) throw new Error(`Login failed for ${email}: ${res.status()}`);
  const body = await res.json();
  return body.access_token;
}
