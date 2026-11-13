import type { Flag, Student } from "./types";

/**
 * Baseline flagging rules from the brief, applied IN ORDER - the first rule a
 * student matches sets their flag:
 *
 *   1. Urgent: q6 = Yes
 *   2. High:   q3 = Often, or q2 = 1
 *   3. Review: any two of (q1 <= 2, q5 = Yes, q4 = No), or q7 = Yes
 *   4. None:   everything else
 *
 * One extra rule added (AC-08), placed between Urgent and High:
 *
 *   1b. High: q6 = "Prefer not to say", or q6 missing/unreadable.
 *       The baseline rules treat a student who avoids the self-harm question
 *       the same as one who answers "No". Declining that question is itself a
 *       signal, and a data error must never hide a child, so unknown is
 *       treated as needing a human look - never as "No". Rationale in README.
 */
export function computeFlag(s: Student): Flag {
  // Rule 1 - Urgent
  if (s.q6_thoughts_of_self_harm === "Yes") {
    return { level: "Urgent", reason: "Reported thoughts of self-harm (Q6: Yes)" };
  }

  // Rule 1b - extra rule (AC-08)
  if (s.q6_thoughts_of_self_harm === "Prefer not to say") {
    return { level: "High", reason: "Declined to answer the self-harm question (Q6) - needs a check-in, not an assumption" };
  }
  if (s.q6_thoughts_of_self_harm === null) {
    return { level: "High", reason: "Self-harm question (Q6) missing or unreadable - treat as unknown, not as No" };
  }

  // Rule 2 - High
  if (s.q3_bullied === "Often") {
    return { level: "High", reason: "Reports being bullied often (Q3)" };
  }
  if (s.q2_safe_at_home === 1) {
    return { level: "High", reason: "Never feels safe at home (Q2: 1)" };
  }

  // Rule 3 - Review
  const signals: string[] = [];
  if (s.q1_sleep_well !== null && s.q1_sleep_well <= 2) signals.push("poor sleep (Q1)");
  if (s.q5_sad_most_days === "Yes") signals.push("sad most days (Q5)");
  if (s.q4_trusted_adult === "No") signals.push("no trusted adult (Q4)");
  if (signals.length >= 2) {
    return { level: "Review", reason: `Two or more concerns: ${signals.join(", ")}` };
  }
  if (s.q7_wants_counsellor === "Yes") {
    return { level: "Review", reason: "Asked to see the counsellor (Q7)" };
  }

  // Rule 4 - None
  return { level: "None", reason: "No baseline rule matched" };
}

export const FLAG_ORDER: Record<Flag["level"], number> = {
  Urgent: 0, High: 1, Review: 2, None: 3,
};

/** Urgent first, then High, Review, None; stable within a level by student ID. */
export function sortByFlag<T extends { flag: Flag; student: Student }>(rows: T[]): T[] {
  return Array.from(rows).sort((a, b) =>
    FLAG_ORDER[a.flag.level] - FLAG_ORDER[b.flag.level] ||
    a.student.student_id.localeCompare(b.student.student_id)
  );
}
