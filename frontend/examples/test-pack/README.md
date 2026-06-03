# Chekin test CSV pack

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
| `students.csv` | **/Students** | 3 new test students. Skip if emails already exist. |
| `teachers.csv` | **/Professors** | Row 1 adds assignment for existing Dr Ahmed; rows 2–3 create new professors. |
| `schooling.csv` | **/Schooling** | 2 new staff (CP + CS). |
| `schedule-1CP-S1.xlsx` | **/Scheduals → Excel file** | **Use this for Today's classes.** Sheet **`Professor_View`**. Year **1CP**, semester **S1**. |
| `schedule-professor-view.csv` | *(upload only)* | Upload works but **Today's classes won't load CSV** — use the `.xlsx` above instead. |
| `exams.csv` | **/Scheduals → Exam CSV** | Uses modules + emails already in your DB. Set `date` to today for teacher **/Exams** testing. |

## Face AI attendance (System A + B)

1. Run Face AI: `AI/face-attendance` → `./venv/Scripts/python.exe manage.py runserver 0.0.0.0:5000`
2. Run backend: `Checkin_backend` → `python manage.py runserver 0.0.0.0:8000`
3. Register each student on Face AI with **name = email** (same as Checkin).
4. Students scan at the kiosk → `GET http://127.0.0.1:5000/api/export-today/` lists emails.
5. **Professor /Sessions** — create or open session → present rows auto-sync; use **Sync Face Scans** for late arrivals.
6. **Professor /Exams** — upload `exams.csv` (admin), then **Open Exam** → face sync runs automatically.

## Manual add (drawer) — example values

**Student:** full_name `Test Manual`, email `test.manual@test.com`, n_inscript `900000000301`, year `1CP`, section `A`, group `G1`

**Professor:** full_name `Dr Manual`, email `dr.manual@test.com`, module `Network 1`, groups `G1;G2`, semester `S1`, section `A`, year `1`

**Schooling:** full_name `Manual Staff`, email `manual.staff@test.com`, department `CP`

## Checklist

1. **Admin** — import students, professors, schooling CSVs; upload **`schedule-1CP-S1.xlsx`**
2. **Admin** — /Sessions, /Absences, /Justifications
3. **Professor** (ahmed@gmail.com) — /Sessions timetable, /ProfAuditions/Requests
4. **Student** (ma.bouabdelli@esi-sba.dz) — /Justifications, /Students/semestrial
5. **Schooling** (ma.bouabdelli76@gmail.com) — schooling justifications & professor requests
6. **Face AI** — register `ho.khaldi@esi-sba.dz`, scan, then professor session/exam sync

## Regenerate

```bash
cd frontend
node examples/generate-test-csv.mjs
node examples/generate-schedule-xlsx.mjs
```

Import can take **10–30 s per row** (password email). Use **new emails** only for create rows.
