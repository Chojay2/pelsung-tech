export type YesNo = "Yes" | "No";

export interface Student {
  student_id: string;
  school: string;
  class: string;
  q1_sleep_well: number | null;        // 1 (rarely) .. 4 (always)
  q2_safe_at_home: number | null;      // 1 (never) .. 4 (always)
  q3_bullied: "Never" | "Sometimes" | "Often" | null;
  q4_trusted_adult: YesNo | null;
  q5_sad_most_days: YesNo | null;
  q6_thoughts_of_self_harm: "Yes" | "No" | "Prefer not to say" | null;
  q7_wants_counsellor: YesNo | null;
  comment: string;
  cleaning_notes: string[];            // what parse.ts had to fix for this row
}

export type FlagLevel = "Urgent" | "High" | "Review" | "None";

export interface Flag {
  level: FlagLevel;
  reason: string;
}

export type FollowUpStatus = "Not started" | "In progress" | "Closed";
