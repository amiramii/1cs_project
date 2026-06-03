/**
 * Generates examples/test-pack/schedule-1CP-S1.xlsx
 * Backend reads sheet "Professor_View" via pd.read_excel (documents/data_loader.py).
 * Run: node examples/generate-schedule-xlsx.mjs
 */
import * as XLSX from "xlsx"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dir = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dir, "test-pack", "schedule-1CP-S1.xlsx")

const professorView = [
  ["Professor", "Day", "Time_Slot", "Session_Type", "Subject", "Group", "Room"],
  ["Dr Ahmed", "Dimanche", "08h-09h30", "Cours", "Network 1", "G1", "SALLE 04"],
  ["Dr Ahmed", "Dimanche", "09h30-11h", "TD", "Network 1", "G1", "SALLE 04"],
  ["Dr Ahmed", "Dimanche", "08h-09h30", "Cours", "Network 1", "G2", "SALLE 05"],
  ["Dr Ahmed", "Lundi", "08h-09h30", "Cours", "Network 2", "G1", "AMPHI A"],
  ["Dr Ahmed", "Lundi", "14h-15h30", "TP", "Network 1", "G1", "SALLE 04"],
  ["Dr Ahmed", "Mardi", "09h30-11h", "TD", "Network 1", "G1", "SALLE 04"],
  ["Dr Ahmed", "Mercredi", "11h-12h30", "Cours", "Network 1", "G1", "SALLE 04"],
  ["Dr Ahmed", "Jeudi", "14h-15h30", "TP", "Network 2", "G1", "SALLE 12"],
  ["Dr Sara", "Dimanche", "08h-09h30", "Cours", "Database", "G3", "SALLE 08"],
  ["Dr Sara", "Dimanche", "09h30-11h", "TD", "Database", "G4", "SALLE 09"],
  ["Dr Sara", "Lundi", "09h30-11h", "Cours", "Operating Systems", "G3", "SALLE TP2"],
  ["Dr Sara", "Mardi", "14h-15h30", "TD", "Operating Systems", "G3", "SALLE TP2"],
  ["Dr Ali", "Lundi", "11h-12h30", "Cours", "Algorithms", "G5", "AMPHI B"],
  ["Dr Ali", "Mercredi", "14h-15h30", "TD", "Algorithms", "G5", "SALLE 11"],
]

const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.aoa_to_sheet(professorView),
  "Professor_View"
)
XLSX.writeFile(wb, outPath)
console.log("Wrote", outPath)
console.log("Upload: /Scheduals → Excel file → year 1CP → semester S1")
