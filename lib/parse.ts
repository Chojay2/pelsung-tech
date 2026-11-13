import fs from "fs";
import path from "path";
import type { Student } from "./types";

/**
 * CSV loading + cleaning.
 *
 * The brief warns the dataset "is not perfectly clean", so every value is
 * normalised on the way in, and anything we had to fix or could not read is
 * recorded in cleaning_notes so a human can see it (never silently guessed).
 *
 * Safety rule: a missing or unreadable answer is treated as "unknown" (null),
 * never as "No". Unknown answers can still raise a flag (see flags.ts) but can
 * never lower one.
 */

/** Minimal CSV parser that handles quoted fields (commas inside comments). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

function clean(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function asScale(raw: string, col: string, notes: string[]): number | null {
  const v = clean(raw);
  if (v === "") { notes.push(`${col}: missing`); return null; }
  const n = Number(v);
  if (Number.isInteger(n) && n >= 1 && n <= 4) return n;
  notes.push(`${col}: unreadable value "${v}"`);
  return null;
}

function asChoice<T extends string>(
  raw: string, col: string, options: T[], notes: string[]
): T | null {
  const v = clean(raw).toLowerCase();
  if (v === "") { notes.push(`${col}: missing`); return null; }
  const match = options.find((o) => o.toLowerCase() === v);
  if (match) {
    if (clean(raw) !== match) notes.push(`${col}: normalised "${clean(raw)}" to "${match}"`);
    return match;
  }
  notes.push(`${col}: unreadable value "${clean(raw)}"`);
  return null;
}

export function loadStudents(): Student[] {
  const file = path.join(process.cwd(), "data", "SA_sample_dataset_SYNTHETIC.csv");
  const rows = parseCsv(fs.readFileSync(file, "utf-8"));
  const header = rows[0].map((h) => clean(h).toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const idx = {
    student_id: col("student_id"), school: col("school"), class: col("class"),
    q1: col("q1_sleep_well"), q2: col("q2_safe_at_home"), q3: col("q3_bullied"),
    q4: col("q4_trusted_adult"), q5: col("q5_sad_most_days"),
    q6: col("q6_thoughts_of_self_harm"), q7: col("q7_wants_counsellor"),
    comment: col("comment"),
  };

  const students: Student[] = [];
  for (const r of rows.slice(1)) {
    const notes: string[] = [];
    const get = (i: number) => (i >= 0 && i < r.length ? r[i] : "");
    const student: Student = {
      student_id: clean(get(idx.student_id)).toUpperCase(),
      school: clean(get(idx.school)),
      class: clean(get(idx.class)).toUpperCase(),
      q1_sleep_well: asScale(get(idx.q1), "q1_sleep_well", notes),
      q2_safe_at_home: asScale(get(idx.q2), "q2_safe_at_home", notes),
      q3_bullied: asChoice(get(idx.q3), "q3_bullied", ["Never", "Sometimes", "Often"], notes),
      q4_trusted_adult: asChoice(get(idx.q4), "q4_trusted_adult", ["Yes", "No"], notes),
      q5_sad_most_days: asChoice(get(idx.q5), "q5_sad_most_days", ["Yes", "No"], notes),
      q6_thoughts_of_self_harm: asChoice(
        get(idx.q6), "q6_thoughts_of_self_harm", ["Yes", "No", "Prefer not to say"], notes
      ),
      q7_wants_counsellor: asChoice(get(idx.q7), "q7_wants_counsellor", ["Yes", "No"], notes),
      comment: clean(get(idx.comment)),
      cleaning_notes: notes,
    };
    if (student.student_id === "") continue; // a row with no ID cannot be tracked
    students.push(student);
  }
  return students;
}
