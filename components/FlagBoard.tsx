"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { Flag, FlagLevel, FollowUpStatus, Student } from "@/lib/types";
import { answersFor } from "@/lib/questions";

interface Row { student: Student; flag: Flag; }

const LEVELS: FlagLevel[] = ["Urgent", "High", "Review", "None"];
const STATUSES: FollowUpStatus[] = ["Not started", "In progress", "Closed"];
const STORAGE_KEY = "sa-followup-v1";
const TOAST_MS = 6000;

type LevelFilter = "All" | FlagLevel;
interface Toast { id: string; from: FollowUpStatus; to: FollowUpStatus; key: number; }

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

export function FlagBoard({ rows }: { rows: Row[] }) {
  const [school, setSchool] = useState("All");
  const [cls, setCls] = useState("All");
  const [level, setLevel] = useState<LevelFilter>("All");
  const [search, setSearch] = useState("");
  const [hideClosed, setHideClosed] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<Toast | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // AC-07: follow-up statuses survive a page refresh (localStorage).
  const [statuses, setStatuses] = useState<Record<string, FollowUpStatus>>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setStatuses(JSON.parse(saved));
    } catch { /* unreadable saved data: start fresh */ }
    setLoaded(true);
  }, []);

  const statusOf = (id: string): FollowUpStatus => statuses[id] ?? "Not started";

  const setStatus = (id: string, to: FollowUpStatus, announce = true) => {
    const from = statusOf(id);
    if (from === to) return;
    const next = { ...statuses, [id]: to };
    setStatuses(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage full or blocked */ }
    setToast(announce ? { id, from, to, key: Date.now() } : null);
  };

  // The confirmation toast clears itself after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  // "/" jumps to search from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.closest("input, select, textarea, [contenteditable]");
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const schools = useMemo(() => ["All", ...Array.from(new Set(rows.map((r) => r.student.school))).sort()], [rows]);
  const classes = useMemo(() => ["All", ...Array.from(new Set(rows.map((r) => r.student.class))).sort()], [rows]);

  // Everything except the flag-level filter. The level tiles count from this,
  // so each tile shows what you would get by clicking it.
  const q = search.trim().toLowerCase();
  const scoped = rows.filter(({ student, flag }) =>
    (school === "All" || student.school === school) &&
    (cls === "All" || student.class === cls) &&
    (q === "" || student.student_id.toLowerCase().includes(q)) &&
    !(hideClosed && flag.level !== "None" && statusOf(student.student_id) === "Closed")
  );
  const visible = scoped.filter(({ flag }) => level === "All" || flag.level === level);

  const counts = Object.fromEntries(LEVELS.map((l) => {
    const inLevel = scoped.filter((r) => r.flag.level === l);
    const open = inLevel.filter((r) => statusOf(r.student.student_id) !== "Closed").length;
    return [l, { total: inLevel.length, open }];
  })) as Record<FlagLevel, { total: number; open: number }>;

  const filtersActive = school !== "All" || cls !== "All" || level !== "All" || q !== "" || hideClosed;
  const clearFilters = () => {
    setSchool("All"); setCls("All"); setLevel("All"); setSearch(""); setHideClosed(false);
  };

  return (
    <>
      <div className="levels" role="group" aria-label="Show students by flag">
        <button
          type="button"
          className="level-tile lt-all"
          aria-pressed={level === "All"}
          onClick={() => setLevel("All")}
        >
          <span className="lt-name">All students</span>
          <span className="lt-n">{scoped.length}</span>
          <span className="lt-sub">every survey response</span>
        </button>
        {LEVELS.map((l) => {
          const c = counts[l];
          const sub = l === "None"
            ? "no rule matched"
            : !loaded ? " "
            : c.total === 0 ? "none flagged"
            : c.open === 0 ? "all closed"
            : `${c.open} still open`;
          return (
            <button
              key={l}
              type="button"
              className={`level-tile lt-${slug(l)}`}
              aria-pressed={level === l}
              onClick={() => setLevel(level === l ? "All" : l)}
            >
              <span className="lt-name"><span className="dot" aria-hidden="true" />{l}</span>
              <span className="lt-n">{c.total}</span>
              <span className={`lt-sub ${l !== "None" && c.open > 0 ? "has-open" : ""}`}>{sub}</span>
            </button>
          );
        })}
      </div>

      <div className="toolbar">
        <div className="field">
          <label htmlFor="f-school">School</label>
          <select id="f-school" value={school} onChange={(e) => setSchool(e.target.value)}>
            {schools.map((s) => <option key={s} value={s}>{s === "All" ? "All schools" : s}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-class">Class</label>
          <select id="f-class" value={cls} onChange={(e) => setCls(e.target.value)}>
            {classes.map((c) => <option key={c} value={c}>{c === "All" ? "All classes" : c}</option>)}
          </select>
        </div>
        <div className="field search">
          <label htmlFor="f-search">Student ID</label>
          <div className="search-box">
            <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14">
              <circle cx="7" cy="7" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              id="f-search"
              type="search"
              placeholder="e.g. S-012"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") setSearch(""); }}
              autoComplete="off"
            />
            {search === "" && <kbd aria-hidden="true">/</kbd>}
          </div>
        </div>
        <label className="switch">
          <input type="checkbox" checked={hideClosed} onChange={(e) => setHideClosed(e.target.checked)} />
          <span className="track" aria-hidden="true" />
          Hide closed
        </label>
        <div className="count" aria-live="polite">
          <span>Showing <strong>{visible.length}</strong> of {rows.length}</span>
          {filtersActive && (
            <button type="button" className="text-btn" onClick={clearFilters}>Clear filters</button>
          )}
        </div>
      </div>

      <table className="board">
        <thead>
          <tr>
            <th scope="col">Student</th>
            <th scope="col">School</th>
            <th scope="col">Class</th>
            <th scope="col">Flag</th>
            <th scope="col">Why flagged</th>
            <th scope="col">Follow-up</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(({ student, flag }) => {
            const id = student.student_id;
            const open = expanded.has(id);
            const status = statusOf(id);
            const closed = flag.level !== "None" && status === "Closed";
            return (
              <Fragment key={id}>
                <tr
                  className={`row lvl-${slug(flag.level)}${closed ? " is-closed" : ""}${open ? " is-open" : ""}`}
                  onClick={(e) => {
                    // Clicking anywhere on the row opens it, except on its controls.
                    if (!(e.target as HTMLElement).closest("button, label, input, a")) toggle(id);
                  }}
                >
                  <td className="id">
                    <button
                      type="button"
                      className="expander"
                      aria-expanded={open}
                      aria-controls={open ? `detail-${id}` : undefined}
                      onClick={() => toggle(id)}
                    >
                      <svg className="chev" aria-hidden="true" viewBox="0 0 16 16" width="12" height="12">
                        <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {id}
                    </button>
                  </td>
                  <td className="school">{student.school}</td>
                  <td className="class">{student.class}</td>
                  <td className="flag"><span className={`badge badge-${slug(flag.level)}`}>{flag.level}</span></td>
                  <td className="reason">
                    {flag.reason}
                    {student.cleaning_notes.length > 0 && (
                      <span className="fixed-tag" title={`Data fixed on load: ${student.cleaning_notes.join("; ")}`}>
                        data fixed
                      </span>
                    )}
                  </td>
                  <td className="followup">
                    {flag.level === "None" ? (
                      <span className="no-followup">Not needed</span>
                    ) : (
                      <StatusControl id={id} value={status} onChange={(s) => setStatus(id, s)} />
                    )}
                  </td>
                </tr>
                {open && (
                  <tr className={`detail-row lvl-${slug(flag.level)}`} id={`detail-${id}`}>
                    <td colSpan={6}><Detail student={student} /></td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          {visible.length === 0 && (
            <tr className="empty-row">
              <td colSpan={6}>
                <p><strong>No students match.</strong> {hideClosed ? "Closed follow-ups are hidden, and the" : "The"} filters above leave nobody to show.</p>
                <button type="button" className="btn" onClick={clearFilters}>Clear filters</button>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="save-note">
        Follow-up statuses are saved in this browser only. Another device or
        browser will not see them.
      </p>

      <div className="toast-region" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.key}>
            <span>
              <strong>{toast.id}</strong> marked <strong>{toast.to}</strong>
            </span>
            <button
              type="button"
              onClick={() => { setStatus(toast.id, toast.from, false); }}
            >
              Undo
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function StatusControl({ id, value, onChange }: {
  id: string; value: FollowUpStatus; onChange: (s: FollowUpStatus) => void;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={`Follow-up status for ${id}`}>
      {STATUSES.map((s) => (
        <label key={s} className={`seg-opt seg-${slug(s)}`}>
          <input
            type="radio"
            name={`status-${id}`}
            value={s}
            checked={value === s}
            onChange={() => onChange(s)}
          />
          <span>{s}</span>
        </label>
      ))}
    </div>
  );
}

function Detail({ student }: { student: Student }) {
  const answers = answersFor(student);
  return (
    <div className="detail">
      <section className="detail-answers" aria-label={`Survey answers for ${student.student_id}`}>
        <h3>Survey answers</h3>
        <dl>
          {answers.map((a) => (
            <div key={a.q} className={`answer${a.concern ? " concern" : ""}${a.unknown ? " unknown" : ""}`}>
              <dt>
                <span className="qn">{a.q}</span>
                <span>{a.label}{a.hint && <small className="hint">{a.hint}</small>}</span>
              </dt>
              <dd>{a.display}</dd>
            </div>
          ))}
        </dl>
        <p className="legend-line"><span className="swatch" aria-hidden="true" /> Highlighted answers count toward a flag rule.</p>
      </section>
      <section className="detail-side">
        <h3>Student’s comment</h3>
        {student.comment ? <blockquote>{student.comment}</blockquote> : <p className="muted">No comment left.</p>}
        {student.cleaning_notes.length > 0 && (
          <>
            <h3>Data fixed on load</h3>
            <ul className="fix-list">
              {student.cleaning_notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
