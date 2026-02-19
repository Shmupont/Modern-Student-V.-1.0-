const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type FetchOptions = RequestInit & { token?: string };

async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((customHeaders as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { headers, ...rest });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ── Types ──────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface AgentProfile {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string;
  avatar_url: string | null;
  category: string;
  tags: string[];
  capabilities: string[];
  pricing_model: string | null;
  pricing_details: Record<string, unknown>;
  demo_url: string | null;
  source_url: string | null;
  api_endpoint: string | null;
  portfolio: PortfolioItem[];
  total_hires: number;
  avg_rating: number | null;
  response_time_hours: number | null;
  tasks_completed: number;
  total_earned_cents: number;
  is_docked: boolean;
  is_featured: boolean;
  dock_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  owner_display_name?: string | null;
  is_active?: boolean;
}

export interface PortfolioItem {
  title: string;
  description: string;
  url?: string | null;
  image_url?: string | null;
}

export interface Conversation {
  id: string;
  agent_profile_id: string;
  initiator_id: string;
  owner_id: string;
  subject: string | null;
  last_message_at: string;
  is_read_by_owner: boolean;
  is_read_by_initiator: boolean;
  created_at: string;
  agent_name?: string | null;
  agent_avatar_url?: string | null;
  other_party_name?: string | null;
  last_message_preview?: string | null;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_agents: number;
  active_tasks: number;
  total_earned_cents: number;
  unread_messages: number;
  agents: AgentBrief[];
  recent_activity: ActivityItem[];
}

export interface AgentBrief {
  id: string;
  name: string;
  avatar_url: string | null;
  status: string;
  category: string;
  tasks_completed: number;
  total_earned_cents: number;
}

export interface ActivityItem {
  type: string;
  message: string;
  timestamp: string;
  agent_name?: string;
}

export interface CategoryCount {
  category: string;
  name?: string;
  count: number;
}

// ── Auth ──────────────────────────────────────────────────────

export async function register(email: string, password: string, display_name?: string) {
  return apiFetch<{ access_token: string; user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, display_name }),
  });
}

export async function login(email: string, password: string) {
  return apiFetch<{ access_token: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(token: string) {
  return apiFetch<User>("/auth/me", { token });
}

// ── Agent Profiles (Public) ──────────────────────────────────

export async function browseAgents(params?: {
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.sort) searchParams.set("sort", params.sort);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  return apiFetch<AgentProfile[]>(`/agents${qs ? `?${qs}` : ""}`);
}

export async function getFeaturedAgents() {
  return apiFetch<AgentProfile[]>("/agents/featured");
}

export async function getCategories() {
  return apiFetch<CategoryCount[]>("/agents/categories");
}

export async function getAgentBySlug(slug: string) {
  return apiFetch<AgentProfile>(`/agents/${slug}`);
}

// ── Agent Profiles (Authenticated) ───────────────────────────

export async function getMyAgents(token: string) {
  return apiFetch<AgentProfile[]>("/agents/mine", { token });
}

export async function createAgent(token: string, data: Partial<AgentProfile>) {
  return apiFetch<AgentProfile>("/agents", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export async function updateAgent(token: string, id: string, data: Partial<AgentProfile>) {
  return apiFetch<AgentProfile>(`/agents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
    token,
  });
}

export async function deleteAgent(token: string, id: string) {
  return apiFetch(`/agents/${id}`, { method: "DELETE", token });
}

// ── Messaging ────────────────────────────────────────────────

export async function startConversation(token: string, data: {
  agent_profile_id: string;
  subject?: string;
  message: string;
}) {
  return apiFetch<Conversation>("/conversations", {
    method: "POST",
    body: JSON.stringify(data),
    token,
  });
}

export async function getConversations(token: string) {
  return apiFetch<Conversation[]>("/conversations", { token });
}

export async function getConversation(token: string, id: string) {
  return apiFetch<{ conversation: Conversation; messages: Message[] }>(
    `/conversations/${id}`, { token }
  );
}

export async function sendMessage(token: string, conversationId: string, content: string) {
  return apiFetch<Message>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
    token,
  });
}

export async function markConversationRead(token: string, id: string) {
  return apiFetch(`/conversations/${id}/read`, { method: "PATCH", token });
}

// ── Dashboard ────────────────────────────────────────────────

export async function getDashboardStats(token: string) {
  return apiFetch<DashboardStats>("/users/dashboard-stats", { token });
}
