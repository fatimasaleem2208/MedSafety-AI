import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "patient" | "professional" | "admin";

export type Profile = {
  name: string;
  email: string;
  age: string;
  gender: string;
  allergies: string[];
  medicalHistory: string;
  emergencyContact: string;
  role: Role;
};

export type Reminder = {
  id: string;
  medicineId: string;
  medicineName: string;
  dose: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate: string;
  food: "before" | "after" | "any";
  instructions: string;
};

export type DoseStatus = "taken" | "skipped" | "snoozed";

export type DoseLogEntry = {
  key: string; // reminderId|date|time
  status: DoseStatus;
  at: string;
};

type State = {
  signedIn: boolean;
  profile: Profile;
  reminders: Reminder[];
  doseLog: Record<string, DoseLogEntry>;
};

const DEFAULT_STATE: State = {
  signedIn: false,
  profile: {
    name: "Amara Khan",
    email: "amara@example.com",
    age: "42",
    gender: "Female",
    allergies: ["Penicillin"],
    medicalHistory: "Type 2 diabetes (2018), hypertension (2021).",
    emergencyContact: "Imran Khan — +92 300 0000000",
    role: "patient",
  },
  reminders: [
    {
      id: "r1",
      medicineId: "metformin",
      medicineName: "Metformin",
      dose: "500 mg",
      frequency: "Twice daily",
      times: ["08:00", "20:00"],
      startDate: "2026-01-01",
      endDate: "",
      food: "after",
      instructions: "Take after breakfast and after dinner.",
    },
    {
      id: "r2",
      medicineId: "omeprazole",
      medicineName: "Omeprazole",
      dose: "20 mg",
      frequency: "Once daily",
      times: ["07:30"],
      startDate: "2026-01-01",
      endDate: "",
      food: "before",
      instructions: "Take 30 minutes before breakfast.",
    },
    {
      id: "r3",
      medicineId: "amlodipine",
      medicineName: "Amlodipine",
      dose: "5 mg",
      frequency: "Once daily",
      times: ["21:00"],
      startDate: "2026-01-01",
      endDate: "",
      food: "any",
      instructions: "Take at the same time each evening.",
    },
  ],
  doseLog: {},
};

const KEY = "mediguardian.state.v1";

type Ctx = State & {
  signIn: (name?: string, email?: string, role?: Role) => void;
  signOut: () => void;
  updateProfile: (p: Partial<Profile>) => void;
  addReminder: (r: Omit<Reminder, "id">) => void;
  updateReminder: (id: string, r: Partial<Reminder>) => void;
  removeReminder: (id: string) => void;
  logDose: (key: string, status: DoseStatus) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...DEFAULT_STATE, ...(JSON.parse(raw) as State) });
    } catch {
      /* ignore corrupted state */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state, hydrated]);

  const signIn = useCallback((name?: string, email?: string, role: Role = "patient") => {
    setState((s) => ({
      ...s,
      signedIn: true,
      profile: {
        ...s.profile,
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
        role,
      },
    }));
  }, []);

  const signOut = useCallback(() => setState((s) => ({ ...s, signedIn: false })), []);

  const updateProfile = useCallback(
    (p: Partial<Profile>) => setState((s) => ({ ...s, profile: { ...s.profile, ...p } })),
    [],
  );

  const addReminder = useCallback(
    (r: Omit<Reminder, "id">) =>
      setState((s) => ({ ...s, reminders: [...s.reminders, { ...r, id: crypto.randomUUID() }] })),
    [],
  );

  const updateReminder = useCallback(
    (id: string, r: Partial<Reminder>) =>
      setState((s) => ({
        ...s,
        reminders: s.reminders.map((x) => (x.id === id ? { ...x, ...r } : x)),
      })),
    [],
  );

  const removeReminder = useCallback(
    (id: string) => setState((s) => ({ ...s, reminders: s.reminders.filter((x) => x.id !== id) })),
    [],
  );

  const logDose = useCallback(
    (key: string, status: DoseStatus) =>
      setState((s) => ({
        ...s,
        doseLog: { ...s.doseLog, [key]: { key, status, at: new Date().toISOString() } },
      })),
    [],
  );

  const value = useMemo(
    () => ({ ...state, signIn, signOut, updateProfile, addReminder, updateReminder, removeReminder, logDose }),
    [state, signIn, signOut, updateProfile, addReminder, updateReminder, removeReminder, logDose],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppStoreProvider");
  return ctx;
}

export type ScheduleItem = {
  key: string;
  reminder: Reminder;
  time: string;
  status: "taken" | "skipped" | "snoozed" | "due" | "upcoming" | "missed";
};

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function buildTodaySchedule(reminders: Reminder[], doseLog: Record<string, DoseLogEntry>, now: Date): ScheduleItem[] {
  const date = todayKey(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const items: ScheduleItem[] = [];
  for (const r of reminders) {
    for (const time of r.times) {
      const key = `${r.id}|${date}|${time}`;
      const logged = doseLog[key];
      const parts = time.split(":");
      const mins = Number(parts[0]) * 60 + Number(parts[1] ?? 0);
      let status: ScheduleItem["status"];
      if (logged) status = logged.status;
      else if (mins > nowMinutes + 30) status = "upcoming";
      else if (mins < nowMinutes - 60) status = "missed";
      else status = "due";
      items.push({ key, reminder: r, time, status });
    }
  }
  return items.sort((a, b) => a.time.localeCompare(b.time));
}
