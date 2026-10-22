export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function setSession(token: string, orgId: string, role: string) {
  localStorage.setItem("access_token", token);
  localStorage.setItem("organization_id", orgId);
  localStorage.setItem("role", role);
}

export function clearSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("organization_id");
  localStorage.removeItem("role");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || JSON.stringify(data);
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  postForm: <T>(path: string, form: FormData) => request<T>(path, { method: "POST", body: form }),
};

// ---- Types mirroring the backend schemas ----

export interface Avatar {
  id: string;
  organization_id: string;
  name: string;
  industry: string;
  role: string;
  appearance_image_url: string | null;
  voice_id: string;
  face_image_path: string | null;
  personality: string;
  speaking_style: string;
  languages: string[];
  greeting: string;
  system_instructions: string;
  escalation_rules: Record<string, unknown>;
  is_active: boolean;
}

export interface ConversationT {
  id: string;
  avatar_id: string;
  user_identifier: string;
  channel: string;
  status: string;
  started_at: string;
  ended_at: string | null;
}

export interface MessageT {
  id: string;
  role: string;
  content: string;
  intent?: string | null;
  confidence?: number | null;
  tool_calls_json?: unknown;
  sources_json?: unknown;
  created_at: string;
}

export interface AgentReply {
  conversation_id: string;
  message: MessageT;
  escalated: boolean;
  escalation_reason: string | null;
}

export interface KnowledgeSourceT {
  id: string;
  avatar_id: string | null;
  name: string;
  source_type: string;
  status: string;
  chunk_count: number;
  created_at: string;
}

export interface ToolConfigT {
  id: string;
  avatar_id: string;
  tool_name: string;
  is_enabled: boolean;
  permissions_json: Record<string, unknown>;
}

export interface EscalationT {
  id: string;
  conversation_id: string;
  reason: string;
  detected_intent: string | null;
  transcript_summary: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export interface LeadT {
  id: string;
  avatar_id: string;
  name: string | null;
  contact: string | null;
  requirements: string | null;
  lead_score: number;
  status: string;
  created_at: string;
}

export interface AppointmentT {
  id: string;
  avatar_id: string;
  customer_name: string | null;
  service: string | null;
  scheduled_time: string;
  status: string;
}

export interface AnalyticsOverview {
  total_conversations: number;
  active_users: number;
  resolution_rate_pct: number;
  escalation_rate_pct: number;
  avg_response_latency_ms: number;
  lead_conversion_rate_pct: number;
  appointment_conversion_rate_pct: number;
  total_leads: number;
  total_appointments: number;
  tool_usage: Record<string, number>;
  tool_success_rate: Record<string, number>;
  most_common_failure_points: Record<string, number>;
  most_common_intents: Record<string, number>;
}
