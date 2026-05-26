const BASE = process.env.EXPO_PUBLIC_RORK_FUNCTIONS_URL ?? "";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE) throw new Error("backend url not configured");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export interface RegisterResponse {
  userId: string;
  code: string;
  name: string;
}

export interface ServerFriend {
  id: string;
  name: string;
  code: string;
  alarmTime: string | null;
  status: string;
  addedAt: number;
  nudgedToday: boolean;
}

export interface ServerWakeRequest {
  id: string;
  friendId: string;
  friendName: string;
  time: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
  outgoing: boolean;
}

export interface ServerNudge {
  fromUserId: string;
  fromName: string;
  createdAt: number;
}

export interface FriendsList {
  friends: ServerFriend[];
  incomingNudges: ServerNudge[];
  wakeRequests: ServerWakeRequest[];
}

export const backend = {
  register(userId: string, name: string): Promise<RegisterResponse> {
    return call<RegisterResponse>("/register", {
      method: "POST",
      body: JSON.stringify({ userId, name }),
    });
  },
  updateProfile(userId: string, patch: { name?: string; alarmTime?: string | null; status?: string }): Promise<{ ok: true }> {
    return call("/profile", { method: "POST", body: JSON.stringify({ userId, ...patch }) });
  },
  listFriends(userId: string): Promise<FriendsList> {
    return call<FriendsList>(`/friends?userId=${encodeURIComponent(userId)}`);
  },
  addFriend(userId: string, code: string): Promise<{ friend: ServerFriend }> {
    return call("/add-friend", { method: "POST", body: JSON.stringify({ userId, code }) });
  },
  removeFriend(userId: string, friendId: string): Promise<{ ok: true }> {
    return call("/remove-friend", { method: "POST", body: JSON.stringify({ userId, friendId }) });
  },
  nudge(userId: string, toFriendId: string): Promise<{ ok: true }> {
    return call("/nudge", { method: "POST", body: JSON.stringify({ userId, toFriendId }) });
  },
  wakeRequest(userId: string, toFriendId: string, time: string): Promise<{ ok: true; id: string }> {
    return call("/wake-request", { method: "POST", body: JSON.stringify({ userId, toFriendId, time }) });
  },
  wakeRespond(userId: string, requestId: string, accept: boolean): Promise<{ ok: true }> {
    return call("/wake-respond", { method: "POST", body: JSON.stringify({ userId, requestId, accept }) });
  },
};
