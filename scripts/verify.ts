/**
 * Hand-checked assertions for the flag engine, cleaning and suppression.
 * Run with: npm run verify
 */
import { loadStudents } from "../lib/parse.ts";
import { computeFlag, sortByFlag } from "../lib/flags.ts";
import { aggregate, suppress } from "../lib/aggregate.ts";
import type { Student } from "../lib/types.ts";

let failed = 0;
function check(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
  if (!ok) failed++;
}

const base: Student = {
  student_id: "T-001", school: "School A", class: "VI",
  q1_sleep_well: 4, q2_safe_at_home: 4, q3_bullied: "Never",
  q4_trusted_adult: "Yes", q5_sad_most_days: "No",
  q6_thoughts_of_self_harm: "No", q7_wants_counsellor: "No",
  comment: "", cleaning_notes: [],
};
const s = (over: Partial<Student>): Student => ({ ...base, ...over });

// Baseline rules, in order
check("q6 Yes -> Urgent", computeFlag(s({ q6_thoughts_of_self_harm: "Yes" })).level, "Urgent");
check("Urgent wins over bullying", computeFlag(s({ q6_thoughts_of_self_harm: "Yes", q3_bullied: "Often" })).level, "Urgent");
check("q3 Often -> High", computeFlag(s({ q3_bullied: "Often" })).level, "High");
check("q2 = 1 -> High", computeFlag(s({ q2_safe_at_home: 1 })).level, "High");
check("two Review signals -> Review", computeFlag(s({ q1_sleep_well: 2, q5_sad_most_days: "Yes" })).level, "Review");
check("one Review signal alone -> None", computeFlag(s({ q5_sad_most_days: "Yes" })).level, "None");
check("q7 Yes -> Review", computeFlag(s({ q7_wants_counsellor: "Yes" })).level, "Review");
check("all clear -> None", computeFlag(base).level, "None");

// Extra rule (AC-08)
check("q6 Prefer not to say -> High", computeFlag(s({ q6_thoughts_of_self_harm: "Prefer not to say" })).level, "High");
check("q6 missing -> High, never None", computeFlag(s({ q6_thoughts_of_self_harm: null })).level, "High");

// Cleaning on the real file
const students = loadStudents();
check("all 72 students load", students.length, 72);
const s008 = students.find((x) => x.student_id === "S-008")!;
check('S-008 " yes " cleaned -> Urgent', computeFlag(s008).level, "Urgent");
const s042 = students.find((x) => x.student_id === "S-042");
check("lowercase id normalised to S-042", Boolean(s042), true);
const s030 = students.find((x) => x.student_id === "S-030")!;
check("quoted comma comment survives", s030.comment.includes('"I am fine"'), true);

// Ordering
const rows = sortByFlag(students.map((student) => ({ student, flag: computeFlag(student) })));
check("Urgent rows first", rows[0].flag.level, "Urgent");
const levels = rows.map((r) => r.flag.level);
const order = { Urgent: 0, High: 1, Review: 2, None: 3 } as const;
check("never out of order", levels.every((l, i) => i === 0 || order[levels[i - 1]] <= order[l]), true);

// Suppression
check("suppress(0) stays 0", suppress(0), "0");
check("suppress(4) -> <5", suppress(4), "<5");
check("suppress(5) stays 5", suppress(5), "5");
const groups = aggregate(rows);
check("no group leaks a 1-4 count",
  groups.every((g) => [g.n, ...Object.values(g.counts)].every((v) => v === "0" || v === "<5" || Number(v) >= 5)),
  true);

console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) FAILED.`);
process.exit(failed === 0 ? 0 : 1);
