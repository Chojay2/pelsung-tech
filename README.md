# SA Flag Board — counsellor prototype

A first slice of the CECD wellbeing platform: a flag board that tells a school
counsellor who needs them first, tracks every follow-up, and reports upward
without identifying any student. **Synthetic data only.**

## Run it (one command)

```bash
npm install && npm run dev
```

Open http://localhost:3000 — `/counsellor` is the flag board, `/supervisor`
the anonymous aggregate view. `npm run verify` runs 20 hand-checked assertions
on the flagging rules, cleaning and privacy suppression.

> Before submitting, replace `data/SA_sample_dataset_SYNTHETIC.csv` with the
> official synthetic file from the release email (same columns, drop-in).

## What works

- All 72 students listed by ID, school and class (AC-01), flagged by the
  baseline rules applied in order, reason shown beside every flag (AC-02)
- Urgent always on top, red-tinted row + solid badge (AC-03)
- Follow-up status per flagged student, saved in the browser so it survives
  refresh (AC-04, AC-07)
- Supervisor view: counts by school × class, no IDs, any count of 1–4 shown
  as "<5" (AC-05)
- Filter by school/class/flag and search by ID (AC-06)

## What does not (yet)

- Follow-up statuses live in `localStorage` on one device — no server, no
  login, no multi-counsellor sync. Right for a prototype, wrong for production.
- The free-text comment column is displayed-adjacent but not analysed.
- No survey-runner: this consumes a finished CSV.

## Rules and assumptions

- Baseline rules implemented exactly as briefed, first match wins
  (`lib/flags.ts`).
- Messy data is normalised on load (case, whitespace); every fix is recorded
  and shown in the UI (`lib/parse.ts`). A missing or unreadable answer is
  treated as **unknown, never as "No"** — unknown can raise a flag but never
  lower one.
- Zero counts are not suppressed (an absence identifies nobody); 1–4 are.

## Extra rule (AC-08)

**Q6 = "Prefer not to say" (or missing) → High.** The baseline rules treat a
student who avoids the self-harm question the same as one who answers "No".
Declining that question is a signal in itself, and a data error must never
hide a child — so both get a High flag with a reason telling the counsellor
to check in, not assume.

## AI tools used

Built with Claude (Anthropic) in a chat session: planning, code generation,
and the verification script. <!-- TODO before submitting: replace the two
examples below with real prompts from YOUR session, and review every file
until you can explain and change it live — the brief disqualifies
submissions the candidate cannot explain. -->

- Prompt that worked: _[your example]_
- Prompt that failed: _[your example]_

## What I would build next

Shared storage with counsellor login and an audit log, the survey-runner so
schools stop re-entering CSVs, comment triage for keywords, and
school-over-time trends on the supervisor view.
