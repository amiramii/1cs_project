/**
 * Generates CSV test files in examples/test-pack/
 * Run: node examples/generate-test-csv.mjs
 */
import { writeFileSync, mkdirSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dir = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dir, "test-pack")
mkdirSync(outDir, { recursive: true })

function toCsv(rows) {
  return (
    rows
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? "")
            if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
            return s
          })
          .join(",")
      )
      .join("\n") + "\n"
  )
}

function writeCsv(filename, rows) {
  writeFileSync(join(outDir, filename), toCsv(rows), "utf8")
}

const students = [
  ["full_name", "email", "n_inscript", "year", "section", "group"],
  ["Test Student Alpha", "test.student.alpha@esi-sba.dz", "900000000001", "1CP", "A", "G1"],
  ["Test Student Beta", "test.student.beta@esi-sba.dz", "900000000002", "1CS", "A", "G1"],
  ["Test Student Gamma", "test.student.gamma@esi-sba.dz", "900000000003", "2CS", "B", "G3"],
]

const teachers = [
  ["full_name", "email", "module", "groups", "semester", "section", "year"],
  ["Dr Ahmed", "ahmed@gmail.com", "Network 1", "G1", "S1", "A", "1"],
  ["Dr Import New", "dr.import.new@test.com", "Network 1", "G1;G2", "S1", "A", "1"],
  ["Dr Import Two", "dr.import.two@test.com", "Database", "G3", "S1", "B", "2"],
]

const schooling = [
  ["full_name", "email", "department"],
  ["Schooling Import One", "schooling.import.one@test.com", "CP"],
  ["Schooling Import Two", "schooling.import.two@test.com", "CS"],
]

const scheduleProfessorView = [
  ["Professor", "Day", "Time_Slot", "Session_Type", "Subject", "Group", "Room"],
  ["Dr Ahmed", "Dimanche", "08h-09h30", "Cours", "Network 1", "G1", "SALLE 04"],
  ["Dr Ahmed", "Dimanche", "09h30-11h", "TD", "Network 1", "G1", "SALLE 04"],
  ["Dr Ahmed", "Dimanche", "08h-09h30", "Cours", "Network 1", "G2", "SALLE 05"],
  ["Dr Ahmed", "Lundi", "08h-09h30", "Cours", "Network 2", "G1", "AMPHI A"],
  ["Dr Ahmed", "Lundi", "14h-15h30", "TP", "Network 1", "G1", "SALLE 04"],
  ["Dr Ahmed", "Mardi", "09h30-11h", "TD", "Network 1", "G1", "SALLE 04"],
  ["Dr Sara", "Dimanche", "08h-09h30", "Cours", "Database", "G3", "SALLE 08"],
  ["Dr Sara", "Lundi", "09h30-11h", "Cours", "Operating Systems", "G3", "SALLE TP2"],
]

const exams = [
  ["module", "date", "start_time", "end_time", "room", "teachers", "students"],
  [
    "Network 1",
    "2026-06-07",
    "08:00",
    "10:00",
    "AMPHI A",
    "ahmed@gmail.com",
    "ma.bouabdelli@esi-sba.dz;ho.khaldi@esi-sba.dz",
  ],
  [
    "Database",
    "2026-06-08",
    "09:00",
    "11:00",
    "SALLE 08",
    "sara@gmail.com",
    "ma.bouabdelli@esi-sba.dz",
  ],
]

writeCsv("students.csv", students)
writeCsv("teachers.csv", teachers)
writeCsv("schooling.csv", schooling)
writeCsv("schedule-professor-view.csv", scheduleProfessorView)
writeCsv("exams.csv", exams)

writeFileSync(
  join(outDir, "README.md"),
  `# Chekin test CSV pack

All files are **CSV** — drag them onto the matching admin page.

## Test accounts

| Role | Email | Name |
|------|-------|------|
| Admin | *(your admin login)* | nourimaram53 |
| Student | ma.bouabdelli@esi-sba.dz | Bouabdelli Maroua Amira (2CS · B · G3) |
| Schooling | ma.bouabdelli76@gmail.com | ma (CP) |
| Professor | ahmed@gmail.com | Dr Ahmed |

## Files

| File | Page | Notes |
|------|------|--------|
| \`students.csv\` | **/Students** | 3 new test students. Skip if emails already exist. |
| \`teachers.csv\` | **/Professors** | Row 1 adds assignment for existing Dr Ahmed; rows 2–3 create new professors. |
| \`schooling.csv\` | **/Schooling** | 2 new staff (CP + CS). |
| \`schedule-professor-view.csv\` | **/Scheduals → Excel file** | Pick year **1CP**, semester **S1**. Professor names must match DB (\`Dr Ahmed\`, \`Dr Sara\`). |
| \`exams.csv\` | Exam upload API | Uses modules + emails already in your DB. |

## Manual add (drawer) — example values

**Student:** full_name \`Test Manual\`, email \`test.manual@test.com\`, n_inscript \`900000000301\`, year \`1CP\`, section \`A\`, group \`G1\`

**Professor:** full_name \`Dr Manual\`, email \`dr.manual@test.com\`, module \`Network 1\`, groups \`G1;G2\`, semester \`S1\`, section \`A\`, year \`1\`

**Schooling:** full_name \`Manual Staff\`, email \`manual.staff@test.com\`, department \`CP\`

## Checklist

1. **Admin** — import students, professors, schooling CSVs; upload schedule CSV
2. **Admin** — /Sessions, /Absences, /Justifications
3. **Professor** (ahmed@gmail.com) — /Sessions timetable, /ProfAuditions/Requests
4. **Student** (ma.bouabdelli@esi-sba.dz) — /Justifications, /Students/semestrial
5. **Schooling** (ma.bouabdelli76@gmail.com) — schooling justifications & professor requests

## Regenerate

\`\`\`bash
cd frontend
node examples/generate-test-csv.mjs
\`\`\`

Import can take **10–30 s per row** (password email). Use **new emails** only for create rows.
`
)

console.log("Wrote CSV test pack in", outDir)
