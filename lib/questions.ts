import type { Student } from "./types";

/**
 * Turns a student's raw answers into display rows for the counsellor's
 * detail panel. `concern` marks an answer that feeds one of the flag rules in
 * flags.ts, so the counsellor sees *which* answers raised the flag.
 * A missing answer is shown as "Not answered" - never filled in.
 */
export interface Answer {
  q: string;
  label: string;
  hint?: string;
  display: string;
  concern: boolean;
  unknown: boolean;
}

function scale(n: number | null): string {
  return n === null ? "Not answered" : `${n} of 4`;
}

function choice(v: string | null): string {
  return v === null ? "Not answered" : v;
}

export function answersFor(s: Student): Answer[] {
  return [
    {
      q: "Q1", label: "Sleeps well",
      hint: "1 rarely · 4 always",
      display: scale(s.q1_sleep_well),
      concern: s.q1_sleep_well !== null && s.q1_sleep_well <= 2,
      unknown: s.q1_sleep_well === null,
    },
    {
      q: "Q2", label: "Feels safe at home",
      hint: "1 never · 4 always",
      display: scale(s.q2_safe_at_home),
      concern: s.q2_safe_at_home === 1,
      unknown: s.q2_safe_at_home === null,
    },
    {
      q: "Q3", label: "Bullied",
      display: choice(s.q3_bullied),
      concern: s.q3_bullied === "Often",
      unknown: s.q3_bullied === null,
    },
    {
      q: "Q4", label: "Has a trusted adult",
      display: choice(s.q4_trusted_adult),
      concern: s.q4_trusted_adult === "No",
      unknown: s.q4_trusted_adult === null,
    },
    {
      q: "Q5", label: "Sad most days",
      display: choice(s.q5_sad_most_days),
      concern: s.q5_sad_most_days === "Yes",
      unknown: s.q5_sad_most_days === null,
    },
    {
      q: "Q6", label: "Thoughts of self-harm",
      display: choice(s.q6_thoughts_of_self_harm),
      // Anything but a clear "No" is a concern here (see AC-08 in flags.ts).
      concern: s.q6_thoughts_of_self_harm !== "No",
      unknown: s.q6_thoughts_of_self_harm === null,
    },
    {
      q: "Q7", label: "Wants to see the counsellor",
      display: choice(s.q7_wants_counsellor),
      concern: s.q7_wants_counsellor === "Yes",
      unknown: s.q7_wants_counsellor === null,
    },
  ];
}
