import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alarm, Friend, MedDoseLog, Medication, QuizCategory, Recording, Settings, SnoozeState, WakeRequest } from "@/types";
import { ymd } from "@/utils/time";
import { backend, ServerFriend, ServerWakeRequest } from "@/utils/backend";
import { requestNotificationPermission, rescheduleAlarms } from "@/utils/alarmNotifications";

const STORAGE_KEY = "cloq:state:v2";

interface RecentQuestion {
  q: string;
  at: number;
}

interface PersistedState {
  onboarded: boolean;
  alarms: Alarm[];
  meds: Medication[];
  settings: Settings;
  recordings: Recording[];
  friends: Friend[];
  wakeRequests: WakeRequest[];
  recentQuestions?: RecentQuestion[];
}

const defaultSettings: Settings = {
  enabledCategories: ["Mixed"],
  defaultMode: "challenge",
  wrongPenalty: "15s",
  premium: false,
  privacyAcknowledged: false,
  snoozeMinutes: 10,
};

function generateUserId(): string {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function mapServerFriend(f: ServerFriend): Friend {
  const today = ymd();
  return {
    id: f.id,
    name: f.name,
    code: f.code,
    alarmTime: f.alarmTime ?? undefined,
    status: (f.status === "set" || f.status === "snoozed" ? f.status : "none") as Friend["status"],
    addedAt: f.addedAt,
    nudgesByDate: f.nudgedToday ? { [today]: true } : {},
  };
}

function mapServerRequest(r: ServerWakeRequest): WakeRequest {
  return {
    id: r.id,
    friendId: r.friendId,
    friendName: r.friendName,
    time: r.time,
    status: r.status,
    createdAt: r.createdAt,
    outgoing: r.outgoing,
  };
}

export const [AppProvider, useApp] = createContextHook(() => {
  const [hydrated, setHydrated] = useState<boolean>(false);
  const [onboarded, setOnboarded] = useState<boolean>(false);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [snooze, setSnoozeState] = useState<SnoozeState | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [wakeRequests, setWakeRequests] = useState<WakeRequest[]>([]);
  const [recentQuestions, setRecentQuestions] = useState<RecentQuestion[]>([]);
  const lastSyncedNameRef = useRef<string>("");
  const lastSyncedAlarmRef = useRef<string>("");

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as PersistedState;
          setOnboarded(parsed.onboarded ?? false);
          setAlarms(parsed.alarms ?? []);
          setMeds(parsed.meds ?? []);
          setSettings({ ...defaultSettings, ...(parsed.settings ?? {}) });
          setRecordings(parsed.recordings ?? []);
          setFriends(parsed.friends ?? []);
          setWakeRequests(parsed.wakeRequests ?? []);
          const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
          setRecentQuestions((parsed.recentQuestions ?? []).filter((r) => r.at >= cutoff));
        }
      } catch (e) {
        console.log("[AppProvider] hydrate error", e);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: PersistedState = { onboarded, alarms, meds, settings, recordings, friends, wakeRequests, recentQuestions };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload)).catch((e) =>
      console.log("[AppProvider] persist error", e)
    );
  }, [hydrated, onboarded, alarms, meds, settings, recordings, friends, wakeRequests, recentQuestions]);

  // Register with backend (ensures userId + code)
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const userId = settings.userId ?? generateUserId();
        const name = settings.displayName?.trim() || "You";
        const res = await backend.register(userId, name);
        if (cancelled) return;
        setSettings((prev) => ({
          ...prev,
          userId: res.userId,
          myCode: res.code,
          displayName: prev.displayName ?? res.name,
        }));
        lastSyncedNameRef.current = res.name;
      } catch (e) {
        console.log("[AppProvider] register error", e);
      }
    })();
    return () => { cancelled = true; };
  }, [hydrated, settings.userId, settings.displayName]);

  const refreshFriends = useCallback(async () => {
    const userId = settings.userId;
    if (!userId) return;
    try {
      const data = await backend.listFriends(userId);
      setFriends(data.friends.map(mapServerFriend));
      setWakeRequests(data.wakeRequests.map(mapServerRequest));
    } catch (e) {
      console.log("[AppProvider] refreshFriends error", e);
    }
  }, [settings.userId]);

  // Sync profile (name + next alarm time) to backend when they change
  useEffect(() => {
    if (!hydrated || !settings.userId) return;
    const name = settings.displayName?.trim() || "You";
    const nextAlarm = alarms.find((a) => a.enabled);
    const alarmTime = nextAlarm ? `${nextAlarm.hour.toString().padStart(2, "0")}:${nextAlarm.minute.toString().padStart(2, "0")}` : null;
    const status = nextAlarm ? "set" : "none";
    const signature = `${name}|${alarmTime ?? ""}|${status}`;
    if (signature === lastSyncedAlarmRef.current) return;
    lastSyncedAlarmRef.current = signature;
    backend.updateProfile(settings.userId, { name, alarmTime, status }).catch((e) =>
      console.log("[AppProvider] updateProfile error", e)
    );
  }, [hydrated, settings.userId, settings.displayName, alarms]);

  // Schedule lock-screen alarm notifications whenever alarms change.
  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      const enabledAlarms = alarms.filter((a) => a.enabled);
      if (enabledAlarms.length === 0) {
        rescheduleAlarms([]).catch(() => {});
        return;
      }
      await requestNotificationPermission();
      rescheduleAlarms(enabledAlarms).catch((e) => console.log("[AppProvider] reschedule error", e));
    })();
  }, [hydrated, alarms]);

  // Pull friend state on hydrate and periodically
  useEffect(() => {
    if (!settings.userId) return;
    refreshFriends();
    const id = setInterval(() => { refreshFriends(); }, 30_000);
    return () => clearInterval(id);
  }, [settings.userId, refreshFriends]);

  const completeOnboarding = useCallback((data: {
    categories: QuizCategory[];
    mode: "challenge" | "loud";
    firstAlarm?: Omit<Alarm, "id" | "enabled">;
  }) => {
    setSettings((prev) => ({ ...prev, enabledCategories: data.categories, defaultMode: data.mode }));
    if (data.firstAlarm) {
      setAlarms((prev) => [
        ...prev,
        { ...data.firstAlarm!, id: `a_${Date.now()}`, enabled: true },
      ]);
    }
    setOnboarded(true);
  }, []);

  const addAlarm = useCallback((a: Omit<Alarm, "id">) => {
    setAlarms((prev) => [...prev, { ...a, id: `a_${Date.now()}` }]);
  }, []);

  const updateAlarm = useCallback((id: string, patch: Partial<Alarm>) => {
    setAlarms((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const removeAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addMed = useCallback((m: Omit<Medication, "id" | "logs" | "streak" | "startDate">) => {
    setMeds((prev) => [
      ...prev,
      { ...m, id: `m_${Date.now()}`, logs: [], streak: 0, startDate: ymd() },
    ]);
  }, []);

  const updateMed = useCallback((id: string, patch: Partial<Medication>) => {
    setMeds((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const removeMed = useCallback((id: string) => {
    setMeds((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const toggleMedDose = useCallback((id: string, date: string, slot: 0 | 1) => {
    setMeds((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const existing = m.logs.find((l) => l.date === date && l.slot === slot);
        let logs: MedDoseLog[];
        if (existing) {
          logs = m.logs.map((l) => (l.date === date && l.slot === slot ? { ...l, taken: !l.taken } : l));
        } else {
          logs = [...m.logs, { date, slot, taken: true }];
        }
        let streak = 0;
        const d = new Date();
        for (let i = 0; i < 60; i++) {
          const k = ymd(d);
          const has = logs.some((l) => l.date === k && l.taken);
          if (has) streak++;
          else break;
          d.setDate(d.getDate() - 1);
        }
        return { ...m, logs, streak };
      })
    );
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetAll = useCallback(() => {
    setOnboarded(false);
    setAlarms([]);
    setMeds([]);
    setSettings(defaultSettings);
    setSnoozeState(null);
    setRecordings([]);
    setFriends([]);
    setWakeRequests([]);
  }, []);

  const startSnooze = useCallback((alarmId: string, minutes: number, adUsed: boolean) => {
    setSnoozeState({ alarmId, resumesAt: Date.now() + minutes * 60_000, adUsed });
  }, []);

  const clearSnooze = useCallback(() => setSnoozeState(null), []);

  const recordQuestionShown = useCallback((q: string) => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    setRecentQuestions((prev) => [...prev.filter((r) => r.at >= cutoff && r.q !== q), { q, at: Date.now() }]);
  }, []);

  const recentQuestionTexts = useMemo(() => recentQuestions.map((r) => r.q), [recentQuestions]);

  const addRecording = useCallback((r: Omit<Recording, "id" | "createdAt">) => {
    const rec: Recording = { ...r, id: `r_${Date.now()}`, createdAt: Date.now() };
    setRecordings((prev) => [...prev, rec]);
    return rec;
  }, []);

  const removeRecording = useCallback((id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const addFriendByCode = useCallback(async (code: string): Promise<Friend | null> => {
    const userId = settings.userId;
    if (!userId) return null;
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length !== 6) return null;
    try {
      const res = await backend.addFriend(userId, cleaned);
      const f = mapServerFriend(res.friend);
      setFriends((prev) => (prev.some((x) => x.id === f.id) ? prev : [...prev, f]));
      return f;
    } catch (e) {
      console.log("[AppProvider] addFriendByCode error", e);
      return null;
    }
  }, [settings.userId]);

  const removeFriend = useCallback((id: string) => {
    const userId = settings.userId;
    setFriends((prev) => prev.filter((f) => f.id !== id));
    if (userId) backend.removeFriend(userId, id).catch((e) => console.log("[AppProvider] removeFriend error", e));
  }, [settings.userId]);

  const sendNudge = useCallback((friendId: string): boolean => {
    const userId = settings.userId;
    if (!userId) return false;
    const today = ymd();
    const friend = friends.find((f) => f.id === friendId);
    if (!friend || friend.nudgesByDate[today]) return false;
    setFriends((prev) =>
      prev.map((f) => (f.id === friendId ? { ...f, nudgesByDate: { ...f.nudgesByDate, [today]: true } } : f))
    );
    backend.nudge(userId, friendId).catch((e) => {
      console.log("[AppProvider] nudge error", e);
      setFriends((prev) =>
        prev.map((f) => {
          if (f.id !== friendId) return f;
          const { [today]: _, ...rest } = f.nudgesByDate;
          return { ...f, nudgesByDate: rest };
        })
      );
    });
    return true;
  }, [settings.userId, friends]);

  const sendWakeRequest = useCallback((friendId: string, time: string) => {
    const userId = settings.userId;
    if (!userId) return;
    const friend = friends.find((f) => f.id === friendId);
    if (!friend) return;
    backend.wakeRequest(userId, friendId, time)
      .then((res) => {
        const req: WakeRequest = {
          id: res.id,
          friendId,
          friendName: friend.name,
          time,
          status: "pending",
          createdAt: Date.now(),
          outgoing: true,
        };
        setWakeRequests((prev) => [...prev, req]);
      })
      .catch((e) => console.log("[AppProvider] wakeRequest error", e));
  }, [settings.userId, friends]);

  const respondToRequest = useCallback((id: string, accept: boolean) => {
    const userId = settings.userId;
    setWakeRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: accept ? "accepted" : "declined" } : r)));
    if (userId) backend.wakeRespond(userId, id, accept).catch((e) => console.log("[AppProvider] wakeRespond error", e));
  }, [settings.userId]);

  return useMemo(
    () => ({
      hydrated,
      onboarded,
      alarms,
      meds,
      settings,
      snooze,
      recordings,
      friends,
      wakeRequests,
      recentQuestions: recentQuestionTexts,
      recordQuestionShown,
      completeOnboarding,
      addAlarm,
      updateAlarm,
      removeAlarm,
      addMed,
      updateMed,
      removeMed,
      toggleMedDose,
      updateSettings,
      resetAll,
      startSnooze,
      clearSnooze,
      addRecording,
      removeRecording,
      addFriendByCode,
      removeFriend,
      sendNudge,
      sendWakeRequest,
      respondToRequest,
      refreshFriends,
    }),
    [hydrated, onboarded, alarms, meds, settings, snooze, recordings, friends, wakeRequests, recentQuestionTexts, recordQuestionShown, completeOnboarding, addAlarm, updateAlarm, removeAlarm, addMed, updateMed, removeMed, toggleMedDose, updateSettings, resetAll, startSnooze, clearSnooze, addRecording, removeRecording, addFriendByCode, removeFriend, sendNudge, sendWakeRequest, respondToRequest, refreshFriends]
  );
});
