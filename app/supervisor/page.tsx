import { loadStudents } from "@/lib/parse";
import { computeFlag } from "@/lib/flags";
import { aggregate, type GroupRow } from "@/lib/aggregate";
import type { FlagLevel } from "@/lib/types";

const LEVELS: FlagLevel[] = ["Urgent", "High", "Review", "None"];
const SUPPRESSED_TITLE = "Between 1 and 4. The exact number is hidden so no child in a small group can be singled out.";

/** One count cell. Zero stays visible but quiet; "<5" explains itself on hover. */
function Count({ level, value }: { level: FlagLevel; value: string }) {
  if (value === "0") return <span className="c c-zero">0</span>;
  const cls = `c c-${level.toLowerCase()}`;
  if (value === "<5") return <abbr className={cls} title={SUPPRESSED_TITLE}>&lt;5</abbr>;
  return <span className={cls}>{value}</span>;
}

export default function SupervisorPage() {
  const students = loadStudents();
  const groups = aggregate(students.map((student) => ({ student, flag: computeFlag(student) })));

  // aggregate() already sorts by school then class; group for display.
  const bySchool = new Map<string, GroupRow[]>();
  for (const g of groups) {
    const list = bySchool.get(g.school) ?? [];
    list.push(g);
    bySchool.set(g.school, list);
  }
  const urgentClasses = groups.filter((g) => g.counts.Urgent !== "0");

  return (
    <main className="narrow">
      <h1>Supervisor view</h1>
      <p className="page-intro">
        Flag counts by school and class. No student is identified here: counts
        between 1 and 4 are shown as “&lt;5” so no child in a small group can
        be singled out.
      </p>

      {urgentClasses.length > 0 ? (
        <p className="attention">
          <strong>Urgent flags</strong> in {urgentClasses.length} {urgentClasses.length === 1 ? "class" : "classes"}:{" "}
          {urgentClasses.map((g) => `${g.school} · ${g.class}`).join(", ")}.
          Counsellors there have the names.
        </p>
      ) : (
        <p className="attention calm">No Urgent flags in any class.</p>
      )}

      <div className="legend" aria-hidden="true">
        {LEVELS.map((l) => (
          <span key={l} className="key"><span className={`dot dot-${l.toLowerCase()}`} />{l}</span>
        ))}
        <span className="suppressed"><b>&lt;5</b> = between 1 and 4, hidden</span>
      </div>

      <div className="matrix-wrap">
        <table className="matrix">
          <thead>
            <tr>
              <th scope="col">Class</th>
              <th scope="col">Students</th>
              {LEVELS.map((l) => (
                <th key={l} scope="col"><span className={`dot dot-${l.toLowerCase()}`} aria-hidden="true" />{l}</th>
              ))}
            </tr>
          </thead>
          {Array.from(bySchool.entries()).map(([school, rows]) => (
            <tbody key={school}>
              <tr className="school-row">
                <th scope="colgroup" colSpan={6}>{school}</th>
              </tr>
              {rows.map((g) => (
                <tr key={`${g.school}-${g.class}`}>
                  <th scope="row">{g.class}</th>
                  <td className="n">
                    {g.n === "<5" ? <abbr className="c-n" title={SUPPRESSED_TITLE}>&lt;5</abbr> : g.n}
                  </td>
                  {LEVELS.map((l) => (
                    <td key={l}><Count level={l} value={g.counts[l]} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      <p className="privacy-note">
        This view is built for reporting upward: a supervisor sees where help is
        needed without ever seeing who needs it. There are deliberately no
        totals: a total next to a “&lt;5” would let anyone subtract their way
        back to the hidden number. Individual follow-up stays with the school
        counsellor.
      </p>
    </main>
  );
}
