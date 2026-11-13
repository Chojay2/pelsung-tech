import type { FlagLevel, Student, Flag } from "./types";

/**
 * Supervisor aggregation (AC-05).
 *
 * Groups flag counts by school and class. No student IDs leave this function.
 * Small-group suppression: any count from 1 to 4 is reported as "<5" so that
 * a flagged child in a small group cannot be singled out. Zero stays "0"
 * (an absence identifies no one). Group size (n) gets the same treatment.
 */
export interface GroupRow {
  school: string;
  class: string;
  n: string;                              // suppressed group size
  counts: Record<FlagLevel, string>;      // suppressed counts
}

export function suppress(n: number): string {
  return n > 0 && n < 5 ? "<5" : String(n);
}

export function aggregate(rows: { student: Student; flag: Flag }[]): GroupRow[] {
  const groups = new Map<string, { school: string; class: string; n: number; counts: Record<FlagLevel, number> }>();
  for (const { student, flag } of rows) {
    const key = `${student.school}||${student.class}`;
    let g = groups.get(key);
    if (!g) {
      g = { school: student.school, class: student.class, n: 0,
            counts: { Urgent: 0, High: 0, Review: 0, None: 0 } };
      groups.set(key, g);
    }
    g.n += 1;
    g.counts[flag.level] += 1;
  }
  return Array.from(groups.values())
    .sort((a, b) => a.school.localeCompare(b.school) || a.class.localeCompare(b.class))
    .map((g) => ({
      school: g.school,
      class: g.class,
      n: suppress(g.n),
      counts: {
        Urgent: suppress(g.counts.Urgent),
        High: suppress(g.counts.High),
        Review: suppress(g.counts.Review),
        None: suppress(g.counts.None),
      },
    }));
}
