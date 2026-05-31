# Excel timetable upload (`/Scheduals` → Excel file)

Use these files to test **Admin → Schedules → Excel file** (POST `/api/documents/api/excel-schedules/`).

## Ready-to-upload file

| File | Use |
|------|-----|
| **`emploi_du_temps-example-1CP-S1.xlsx`** | Upload as-is: pick year **1CP**, semester **S1**, drop the file. |
| `professor-view-sheet.csv` | Same data; open in Excel → save as `.xlsx` with sheet name **`Professor_View`**. |

## Required workbook format

The backend reads **only** the sheet named **`Professor_View`** (`documents/data_loader.py`).

| Column | Example | Notes |
|--------|---------|--------|
| `Professor` | `Dr Ahmed` | Must match the teacher **`full_name`** in the DB (same spelling as import CSV). |
| `Day` | `Dimanche` | `Dimanche`, `Lundi`, `Mardi`, `Mercredi`, `Jeudi` (no classes Fri/Sat). |
| `Time_Slot` | `08h-09h30` | Also: `09h30-11h`, `11h-12h30`, `14h-15h30`, `14h-16h00` |
| `Session_Type` | `Cours` | e.g. `TD`, `TP`, `Anglais` |
| `Subject` | `Network 1` | Module label |
| `Group` | `G1` | `G1`–`G8` or `All` |
| `Room` | `SALLE 04` | Room / amphi |

## Upload steps

1. Import users first: `../import/teachers.csv`, `students.csv` (professor names in the Excel must exist as `full_name`).
2. Academic year in the DB: the dropdown uses **`1CP`**, but CSV import often creates **`1`**, **`2`**, **`3`** — the app maps those automatically. If no years exist, upload will try to create **`1CP`**.
3. Go to **`/Scheduals`** → **Excel file** → select year + **S1** or **S2** → upload `.xlsx` (max 5 MB; `.xls` / `.csv` also accepted).
4. List uploads: **`/Scheduals/Excel-Schedules`**.
5. Professors see **Today's timetable (Excel)** on the Sessions page (`GET /api/documents/schedule/today/{professor}/`).

## Testing “today” on a weekend

Classes run **Sunday–Thursday**. On Friday/Saturday the API returns no slots. To test anyway, call the API with a day override, e.g.  
`/api/documents/schedule/today/Dr%20Ahmed/?day=Dimanche`

## What upload does *not* do

Upload **stores** the file and metadata (`ExcelSchedule`). It does **not** auto-create attendance sessions; those are still created from the Sessions UI.
