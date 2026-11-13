"use client";

import { useEffect, useMemo, useState } from "react";
import type { Flag, FollowUpStatus, Student } from "@/lib/types";

interface Row { student: Student; flag: Flag; }

const STATUSES: FollowUpStatus[] = ["Not started", "In progress", "Closed"];
const STORAGE_KEY = "sa-followup-v1";
const badgeClass: Record<Flag["level"], string> = {
  Urgent: "badge badge-urgent", High: "badge badge-high",
  Review: "badge badge-review", None: "badge badge-none",
};

export function FlagBoard({ rows }: { rows: Row[] }) {
  const [school, setSchool] = useState("All");
  const [cls, setCls] = useState("All");
  const [level, setLevel] = useState("All");
  const [search, setSearch] = useState("");

  // AC-07: follow-up statuses survive a page refresh (localStorage).
  const [statuses, setStatuses] = useState<Record<string, FollowUpStatus>>({});
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setStatuses(JSON.parse(saved));
    } catch { /* unreadable saved data: start fresh */ }
  }, []);
  const setStatus = (id: string, status: FollowUpStatus) => {
    setStatuses((prev) => {
      const next = { ...prev, [id]: status };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage full or blocked */ }
      return next;
    });
  };

  const schools = useMemo(() => ["All", ...Array.from(new Set(rows.map((r) => r.student.school))).sort()], [rows]);
  const classes = useMemo(() => ["All", ...Array.from(new Set(rows.map((r) => r.student.class))).sort()], [rows]);

  const visible = rows.filter(({ student, flag }) =>
    (school === "All" || student.school === school) &&
    (cls === "All" || student.class === cls) &&
    (level === "All" || flag.level === level) &&
    (search.trim() === "" || student.student_id.toLowerCase().includes(search.trim().toLowerCase()))
  );

  return (
    <>
      <div className="toolbar">
        <label>
          School{" "}
          <select value={school} onChange={(e) => setSchool(e.target.value)}>
            {schools.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label>
          Class{" "}
          <select value={cls} onChange={(e) => setCls(e.target.value)}>
            {classes.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>
          Flag{" "}
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            {["All", "Urgent", "High", "Review", "None"].map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <input
          type="search"
          placeholder="Search student ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search by student ID"
        />
        <span className="count">{visible.length} of {rows.length} students</span>
      </div>

      <table className="board">
        <thead>
          <tr>
            <th scope="col">Student</th>
            <th scope="col">School</th>
            <th scope="col">Class</th>
            <th scope="col">Flag</th>
            <th scope="col">Reason</th>
            <th scope="col">Follow-up</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(({ student, flag }) => {
            const status = statuses[student.student_id] ?? "Not started";
            return (
              <tr key={student.student_id} className={flag.level === "Urgent" ? "row-urgent" : ""}>
                <td className="id">{student.student_id}</td>
                <td>{student.school}</td>
                <td>{student.class}</td>
                <td><span className={badgeClass[flag.level]}>{flag.level}</span></td>
                <td className="reason" title={flag.reason}>
                  {flag.reason}
                  {student.cleaning_notes.length > 0 && (
                    <div className="data-note">Data fixed on load: {student.cleaning_notes.join("; ")}</div>
                  )}
                </td>
                <td>
                  {flag.level === "None" ? (
                    <span className="badge badge-none">—</span>
                  ) : (
                    <select
                      className={`status ${status === "In progress" ? "started" : status === "Closed" ? "closed" : ""}`}
                      value={status}
                      onChange={(e) => setStatus(student.student_id, e.target.value as FollowUpStatus)}
                      aria-label={`Follow-up status for ${student.student_id}`}
                    >
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  )}
                </td>
              </tr>
            );
          })}
          {visible.length === 0 && (
            <tr><td colSpan={6}>No students match these filters. Clear a filter to see more.</td></tr>
          )}
        </tbody>
      </table>
    </>
  );
}
