import { loadStudents } from "@/lib/parse";
import { computeFlag } from "@/lib/flags";
import { aggregate } from "@/lib/aggregate";

export default function SupervisorPage() {
  const students = loadStudents();
  const groups = aggregate(students.map((student) => ({ student, flag: computeFlag(student) })));
  return (
    <main className="narrow">
      <h1>Supervisor view</h1>
      <p className="page-intro">
        Flag counts by school and class. No student is identified here: counts
        between 1 and 4 are shown as “&lt;5” so no child in a small group can
        be singled out.
      </p>
      <table className="matrix">
        <thead>
          <tr>
            <th scope="col">School</th>
            <th scope="col">Class</th>
            <th scope="col">Students</th>
            <th scope="col">Urgent</th>
            <th scope="col">High</th>
            <th scope="col">Review</th>
            <th scope="col">None</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr key={`${g.school}-${g.class}`}>
              <td>{g.school}</td>
              <td>{g.class}</td>
              <td>{g.n}</td>
              <td className={g.counts.Urgent !== "0" ? "urgent-cell" : ""}>{g.counts.Urgent}</td>
              <td>{g.counts.High}</td>
              <td>{g.counts.Review}</td>
              <td>{g.counts.None}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="privacy-note">
        This view is built for reporting upward: a supervisor sees where help is
        needed without ever seeing who needs it. Individual follow-up stays with
        the school counsellor.
      </p>
    </main>
  );
}
