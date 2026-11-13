import { loadStudents } from "@/lib/parse";
import { computeFlag, sortByFlag } from "@/lib/flags";
import { FlagBoard } from "@/components/FlagBoard";

export default function CounsellorPage() {
  const students = loadStudents();
  const rows = sortByFlag(students.map((student) => ({ student, flag: computeFlag(student) })));
  return (
    <main>
      <h1>Counsellor flag board</h1>
      <p className="page-intro">
        Every student from the survey, ordered by who needs you first. Urgent
        students stay at the top whatever you filter. Open a row to see the
        student’s answers and comment.
      </p>
      <FlagBoard rows={rows} />
    </main>
  );
}
