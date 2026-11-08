import { findInteraction, severityLabel } from "@/data/interactions";
import { getMedicine } from "@/data/medicines";
import type { Reminder, ScheduleItem } from "@/lib/app-store";

export type SafetyAlert = {
  id: string;
  level: "safe" | "caution" | "risk";
  title: string;
  detail: string;
  kind: "interaction" | "duplicate" | "allergy" | "missed" | "contraindication" | "info";
};

const ALLERGY_MAP: Record<string, string[]> = {
  penicillin: ["amoxicillin"],
  nsaid: ["ibuprofen"],
  aspirin: ["ibuprofen"],
  sulfa: [],
  statin: ["atorvastatin"],
};

export function buildSafetyAlerts(
  reminders: Reminder[],
  allergies: string[],
  schedule: ScheduleItem[] = [],
): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];
  const ids = reminders.map((r) => r.medicineId);

  // interactions
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const idA = ids[i]!;
      const idB = ids[j]!;
      const found = findInteraction(idA, idB);
      if (!found || found.severity === "none") continue;
      alerts.push({
        id: `int-${idA}-${idB}`,
        level: found.severity === "major" ? "risk" : "caution",
        kind: "interaction",
        title: `${getMedicine(idA)?.generic.split(" ")[0]} + ${getMedicine(idB)?.generic.split(" ")[0]}`,
        detail: `${severityLabel[found.severity]} interaction — ${found.clinicalEffect}`,
      });
    }
  }

  // duplicates (same drug class)
  const byClass = new Map<string, string[]>();
  for (const id of ids) {
    const med = getMedicine(id);
    if (!med) continue;
    byClass.set(med.drugClass, [...(byClass.get(med.drugClass) ?? []), med.generic]);
  }
  for (const [cls, names] of byClass) {
    if (names.length > 1) {
      alerts.push({
        id: `dup-${cls}`,
        level: "caution",
        kind: "duplicate",
        title: "Possible duplicate therapy",
        detail: `${names.join(" and ")} belong to the same class (${cls}).`,
      });
    }
  }

  // allergies
  for (const allergy of allergies) {
    const key = allergy.trim().toLowerCase();
    const conflicting = (ALLERGY_MAP[key] ?? []).filter((id) => ids.includes(id));
    if (conflicting.length) {
      alerts.push({
        id: `allergy-${key}`,
        level: "risk",
        kind: "allergy",
        title: `Allergy conflict: ${allergy}`,
        detail: `Your medication list contains ${conflicting.map((c) => getMedicine(c)?.generic).join(", ")}.`,
      });
    }
  }
  if (allergies.length && !alerts.some((a) => a.kind === "allergy")) {
    alerts.push({
      id: "allergy-ok",
      level: "safe",
      kind: "allergy",
      title: "No allergy conflict detected",
      detail: `Checked ${allergies.join(", ")} against ${ids.length} medicines.`,
    });
  }

  // missed doses
  const missed = schedule.filter((s) => s.status === "missed");
  if (missed.length) {
    alerts.push({
      id: "missed",
      level: "caution",
      kind: "missed",
      title: `${missed.length} missed dose${missed.length > 1 ? "s" : ""} today`,
      detail: missed.map((m) => `${m.reminder.medicineName} at ${m.time}`).join(", "),
    });
  }

  if (!alerts.length) {
    alerts.push({
      id: "all-clear",
      level: "safe",
      kind: "info",
      title: "No safety alerts",
      detail: "No interactions, duplicates or allergy conflicts detected in your current list.",
    });
  }

  return alerts.sort((a, b) => {
    const order = { risk: 0, caution: 1, safe: 2 };
    return order[a.level] - order[b.level];
  });
}
