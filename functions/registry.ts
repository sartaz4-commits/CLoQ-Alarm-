import { DurableObject } from "cloudflare:workers";

interface UserRow {
  user_id: string;
  code: string;
  name: string;
  alarm_time: string | null;
  status: string;
  updated_at: number;
}

interface FriendshipRow {
  user_id: string;
  friend_user_id: string;
  added_at: number;
}

interface NudgeRow {
  from_user_id: string;
  to_user_id: string;
  date: string;
  created_at: number;
}

interface WakeRequestRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_name: string;
  time: string;
  status: string;
  created_at: number;
}

function genCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function jsonRes(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

export class Registry extends DurableObject {
  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        alarm_time TEXT,
        status TEXT NOT NULL DEFAULT 'none',
        updated_at INTEGER NOT NULL
      )
    `);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS friendships (
        user_id TEXT NOT NULL,
        friend_user_id TEXT NOT NULL,
        added_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, friend_user_id)
      )
    `);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS nudges (
        from_user_id TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        date TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (from_user_id, to_user_id, date)
      )
    `);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS wake_requests (
        id TEXT PRIMARY KEY,
        from_user_id TEXT NOT NULL,
        to_user_id TEXT NOT NULL,
        from_name TEXT NOT NULL,
        time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL
      )
    `);
  }

  override async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (path === "/register" && request.method === "POST") return this.register(await request.json());
      if (path === "/profile" && request.method === "POST") return this.updateProfile(await request.json());
      if (path === "/friends" && request.method === "GET") return this.listFriends(url.searchParams.get("userId") ?? "");
      if (path === "/add-friend" && request.method === "POST") return this.addFriend(await request.json());
      if (path === "/remove-friend" && request.method === "POST") return this.removeFriend(await request.json());
      if (path === "/nudge" && request.method === "POST") return this.nudge(await request.json());
      if (path === "/wake-request" && request.method === "POST") return this.wakeRequest(await request.json());
      if (path === "/wake-respond" && request.method === "POST") return this.wakeRespond(await request.json());
      return jsonRes({ error: "not found" }, 404);
    } catch (e) {
      console.error("[Registry] error", e);
      const msg = e instanceof Error ? e.message : "internal error";
      return jsonRes({ error: msg }, 500);
    }
  }

  private getUserById(userId: string): UserRow | null {
    const rows = this.ctx.storage.sql
      .exec<UserRow>("SELECT * FROM users WHERE user_id = ?", userId)
      .toArray();
    return rows[0] ?? null;
  }

  private getUserByCode(code: string): UserRow | null {
    const rows = this.ctx.storage.sql
      .exec<UserRow>("SELECT * FROM users WHERE code = ?", code)
      .toArray();
    return rows[0] ?? null;
  }

  private register(body: { userId: string; name?: string }): Response {
    if (!body.userId) return jsonRes({ error: "userId required" }, 400);
    const existing = this.getUserById(body.userId);
    if (existing) {
      if (body.name && body.name !== existing.name) {
        this.ctx.storage.sql.exec(
          "UPDATE users SET name = ?, updated_at = ? WHERE user_id = ?",
          body.name.slice(0, 24), Date.now(), body.userId,
        );
        existing.name = body.name.slice(0, 24);
      }
      return jsonRes({ userId: existing.user_id, code: existing.code, name: existing.name });
    }
    let code = genCode();
    for (let i = 0; i < 8 && this.getUserByCode(code); i++) code = genCode();
    const name = (body.name ?? "Friend").slice(0, 24);
    this.ctx.storage.sql.exec(
      "INSERT INTO users (user_id, code, name, status, updated_at) VALUES (?, ?, ?, 'none', ?)",
      body.userId, code, name, Date.now(),
    );
    return jsonRes({ userId: body.userId, code, name });
  }

  private updateProfile(body: { userId: string; name?: string; alarmTime?: string | null; status?: string }): Response {
    const u = this.getUserById(body.userId);
    if (!u) return jsonRes({ error: "user not found" }, 404);
    const name = body.name?.slice(0, 24) ?? u.name;
    const alarmTime = body.alarmTime === undefined ? u.alarm_time : body.alarmTime;
    const status = body.status ?? u.status;
    this.ctx.storage.sql.exec(
      "UPDATE users SET name = ?, alarm_time = ?, status = ?, updated_at = ? WHERE user_id = ?",
      name, alarmTime, status, Date.now(), body.userId,
    );
    return jsonRes({ ok: true });
  }

  private listFriends(userId: string): Response {
    if (!userId) return jsonRes({ error: "userId required" }, 400);
    const friendships = this.ctx.storage.sql
      .exec<FriendshipRow>("SELECT * FROM friendships WHERE user_id = ?", userId)
      .toArray();
    const friends = friendships.map((f) => {
      const u = this.getUserById(f.friend_user_id);
      const today = todayYmd();
      const nudgedToday = this.ctx.storage.sql
        .exec<{ c: number }>(
          "SELECT COUNT(*) as c FROM nudges WHERE from_user_id = ? AND to_user_id = ? AND date = ?",
          userId, f.friend_user_id, today,
        )
        .toArray()[0]?.c ?? 0;
      return {
        id: f.friend_user_id,
        name: u?.name ?? "Friend",
        code: u?.code ?? "",
        alarmTime: u?.alarm_time ?? null,
        status: u?.status ?? "none",
        addedAt: f.added_at,
        nudgedToday: nudgedToday > 0,
      };
    });

    const incomingNudges = this.ctx.storage.sql
      .exec<NudgeRow & { from_name: string }>(
        `SELECT n.from_user_id, n.to_user_id, n.date, n.created_at, u.name as from_name
         FROM nudges n JOIN users u ON u.user_id = n.from_user_id
         WHERE n.to_user_id = ? AND n.date = ?
         ORDER BY n.created_at DESC`,
        userId, todayYmd(),
      )
      .toArray()
      .map((r) => ({ fromUserId: r.from_user_id, fromName: r.from_name, createdAt: r.created_at }));

    const requestsOutgoing = this.ctx.storage.sql
      .exec<WakeRequestRow>(
        "SELECT * FROM wake_requests WHERE from_user_id = ? ORDER BY created_at DESC LIMIT 50",
        userId,
      )
      .toArray()
      .map((r) => ({
        id: r.id, friendId: r.to_user_id, friendName: this.getUserById(r.to_user_id)?.name ?? "Friend",
        time: r.time, status: r.status, createdAt: r.created_at, outgoing: true,
      }));

    const requestsIncoming = this.ctx.storage.sql
      .exec<WakeRequestRow>(
        "SELECT * FROM wake_requests WHERE to_user_id = ? ORDER BY created_at DESC LIMIT 50",
        userId,
      )
      .toArray()
      .map((r) => ({
        id: r.id, friendId: r.from_user_id, friendName: r.from_name,
        time: r.time, status: r.status, createdAt: r.created_at, outgoing: false,
      }));

    return jsonRes({ friends, incomingNudges, wakeRequests: [...requestsOutgoing, ...requestsIncoming] });
  }

  private addFriend(body: { userId: string; code: string }): Response {
    const me = this.getUserById(body.userId);
    if (!me) return jsonRes({ error: "register first" }, 400);
    const code = body.code.trim().toUpperCase();
    if (code === me.code) return jsonRes({ error: "that's your own code" }, 400);
    const other = this.getUserByCode(code);
    if (!other) return jsonRes({ error: "code not found" }, 404);
    const now = Date.now();
    this.ctx.storage.sql.exec(
      "INSERT OR IGNORE INTO friendships (user_id, friend_user_id, added_at) VALUES (?, ?, ?)",
      me.user_id, other.user_id, now,
    );
    this.ctx.storage.sql.exec(
      "INSERT OR IGNORE INTO friendships (user_id, friend_user_id, added_at) VALUES (?, ?, ?)",
      other.user_id, me.user_id, now,
    );
    return jsonRes({
      friend: {
        id: other.user_id, name: other.name, code: other.code,
        alarmTime: other.alarm_time, status: other.status, addedAt: now, nudgedToday: false,
      },
    });
  }

  private removeFriend(body: { userId: string; friendId: string }): Response {
    this.ctx.storage.sql.exec(
      "DELETE FROM friendships WHERE (user_id = ? AND friend_user_id = ?) OR (user_id = ? AND friend_user_id = ?)",
      body.userId, body.friendId, body.friendId, body.userId,
    );
    return jsonRes({ ok: true });
  }

  private nudge(body: { userId: string; toFriendId: string }): Response {
    const today = todayYmd();
    const existing = this.ctx.storage.sql
      .exec<{ c: number }>(
        "SELECT COUNT(*) as c FROM nudges WHERE from_user_id = ? AND to_user_id = ? AND date = ?",
        body.userId, body.toFriendId, today,
      )
      .toArray()[0]?.c ?? 0;
    if (existing > 0) return jsonRes({ error: "already nudged today" }, 409);
    this.ctx.storage.sql.exec(
      "INSERT INTO nudges (from_user_id, to_user_id, date, created_at) VALUES (?, ?, ?, ?)",
      body.userId, body.toFriendId, today, Date.now(),
    );
    return jsonRes({ ok: true });
  }

  private wakeRequest(body: { userId: string; toFriendId: string; time: string }): Response {
    const me = this.getUserById(body.userId);
    if (!me) return jsonRes({ error: "register first" }, 400);
    const id = `wr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.ctx.storage.sql.exec(
      "INSERT INTO wake_requests (id, from_user_id, to_user_id, from_name, time, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)",
      id, body.userId, body.toFriendId, me.name, body.time, Date.now(),
    );
    return jsonRes({ ok: true, id });
  }

  private wakeRespond(body: { userId: string; requestId: string; accept: boolean }): Response {
    this.ctx.storage.sql.exec(
      "UPDATE wake_requests SET status = ? WHERE id = ? AND to_user_id = ?",
      body.accept ? "accepted" : "declined", body.requestId, body.userId,
    );
    return jsonRes({ ok: true });
  }
}
