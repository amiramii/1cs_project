import { uploadCheckinCsv } from "@/lib/checkinClient"

function csvEscape(value: unknown): string {
  const s = String(value ?? "")
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function uploadSingleCsvRow(
  userType: "student" | "teacher" | "schooling",
  headers: string[],
  row: Record<string, unknown>
): Promise<Response> {
  const csv = [
    headers.join(","),
    headers.map((key) => csvEscape(row[key])).join(","),
  ].join("\n")
  const file = new File([csv], `${userType}-manual.csv`, {
    type: "text/csv",
  })
  return uploadCheckinCsv(file, userType)
}
