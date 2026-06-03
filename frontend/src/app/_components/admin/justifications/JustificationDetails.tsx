"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, SquarePen, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import JustificationCard from "./JustificationCard";
import { authorizedFetchBare, listAuthHeaders } from "@/lib/checkinClient";

import {
  getJustificationById,
  patchJustificationAccept,
  patchJustificationRefuse,
} from "@/lib/checkinClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

interface Attendance {
  id: number;
  status: string;
  module: string;
  group: string;
  date: string;
  start_time: string;
  end_time: string;
}

interface Justification {
  id: number;
  startDate: string;
  endDate: string;
  cause: string;
  pdfPath: string;
  status: string;
}

interface StudentInfo {
  name: string;
  email: string;
  group: string;
  year: string;
}

interface RawJustification {
  id: number;
  student_name: string;
  student_email: string;
  absence_type: string;
  cause: string;
  file: string;
  status: string;
  created_at: string;
  attendances: Attendance[];
  exam_attendances?: Attendance[];
}

function allAttendanceRows(r: RawJustification): Attendance[] {
  return [...(r.attendances ?? []), ...(r.exam_attendances ?? [])];
}

// Replace the custom fetchJustification function with this:
async function fetchJustification(id: number): Promise<RawJustification> {
  const res = await getJustificationById(id);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

interface ModalProps {
  justification: Justification;
  onClose: () => void;
  onAction: (id: number, action: "accept" | "reject", note: string) => void;
}

function AbsenceDetailsModal({ justification, onClose, onAction }: ModalProps) {
  const [note, setNote] = useState("");
  const [pdfObjectUrl, setPdfObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!justification.pdfPath) return;
  
    const fullUrl = justification.pdfPath.startsWith("http")
      ? justification.pdfPath
      : `${API_BASE}${justification.pdfPath}`;
  
    authorizedFetchBare(fullUrl, { method: "GET" })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        setPdfObjectUrl(URL.createObjectURL(blob));
      })
      .catch((e) => {
        console.error("PDF fetch failed:", e);
        setPdfObjectUrl(null);
      });
  
    return () => {
      if (pdfObjectUrl) URL.revokeObjectURL(pdfObjectUrl);
    };
  }, [justification.pdfPath]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1A2036] rounded-2xl shadow-2xl w-[820px] max-w-[95vw] flex flex-row overflow-hidden relative">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-white dark:bg-[#1A2036] border border-[#e0e7f0] rounded-full p-1.5 shadow hover:bg-gray-100 transition z-10"
        >
          <X size={18} className="text-[#1B2065] dark:text-[#EEF4F7]" />
        </button>

        {/* Left: PDF viewer */}
        <div className="w-[48%] bg-[#f4f6fb] flex items-center justify-center p-6">
          {pdfObjectUrl ? (
            <iframe
              src={pdfObjectUrl}
              title="Justification document"
              className="w-full h-[460px] rounded-xl shadow-md bg-white"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-[#51689A]/40 text-sm text-[#5D719D]">
              {justification.pdfPath ? "Loading document…" : "No document uploaded"}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="w-[52%] flex flex-col p-8 gap-5">
          <h2 className="text-2xl font-bold text-[#1B2065] dark:text-[#EEF4F7]">Absences details</h2>

          <div>
            <p className="text-sm text-[#51689A] dark:text-[#9BA8C4] mb-1">Absence date :</p>
            <p className="text-lg font-semibold text-[#4e7de0]">
              {justification.startDate}
              {justification.endDate && justification.endDate !== justification.startDate
                ? ` - ${justification.endDate}`
                : ""}
            </p>
          </div>

          <div>
            <p className="text-sm text-[#51689A] dark:text-[#9BA8C4] mb-1">Absence cause :</p>
            <p className="text-base font-semibold text-[#1B2065] dark:text-[#EEF4F7]">{justification.cause}</p>
          </div>

          <div>
            <p className="text-sm text-[#51689A] dark:text-[#9BA8C4] mb-1">Status :</p>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize
              ${justification.status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : justification.status === "accepted"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"}`}>
              {justification.status}
            </span>
          </div>

          <hr className="border-[#e8edf5]" />

          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-bold text-[#1B2065] dark:text-[#EEF4F7]">Notes</h3>
            <p className="text-sm text-[#4e7de0]">Mention rejection reasons</p>
            <textarea
              className="w-full border border-[#c5d0e8] rounded-xl p-3 text-sm text-[#1B2065] dark:text-[#EEF4F7] placeholder-[#b0bcd4] resize-none focus:outline-none focus:ring-2 focus:ring-[#4e7de0]/30 transition min-h-[100px]"
              placeholder="Leave note.."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <button className="self-end flex items-center gap-2 bg-[#4e7de0] text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-[#3a65c8] transition shadow-sm">
              <SquarePen size={15} />
              Save Note
            </button>
          </div>

          <div className="flex flex-row gap-4 mt-2">
            <button
              onClick={() => onAction(justification.id, "accept", note)}
              className="flex-1 border border-[#4e7de0] text-[#4e7de0] font-semibold py-2.5 rounded-xl hover:bg-[#eef2fb] transition text-sm"
            >
              Accept
            </button>
            <button
              onClick={() => onAction(justification.id, "reject", note)}
              className="flex-1 bg-[#f87171] text-white font-semibold py-2.5 rounded-xl hover:bg-[#ef4444] transition text-sm shadow-sm"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JustificationDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The table passes ?student=email — we also need the requestIds
  // Better: table should pass ?ids=1,2,3 so we can fetch each one
  const idsParam = searchParams.get("ids");        // e.g. "12,15,20"
  const studentParam = searchParams.get("student"); // e.g. "m.bensaber@esi-sba.dz"

  const [justifications, setJustifications] = useState<Justification[]>([]);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [selected, setSelected] = useState<Justification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idsParam) {
      setError("No justification IDs provided.");
      setLoading(false);
      return;
    }

    const ids = idsParam.split(",").map(Number).filter(Boolean);

    (async () => {
      try {
        const results = await Promise.all(ids.map(fetchJustification));

        // Extract student info from first result
        const first = results[0];
        if (first) {
          const slots = allAttendanceRows(first);
          setStudentInfo({
            name: first.student_name,
            email: first.student_email,
            group: slots[0]?.group ?? "—",
            year: "—",
          });
        }

        const mapped: Justification[] = results.map((r) => {
          const slots = allAttendanceRows(r);
          return {
          id: r.id,
          startDate: slots[0]?.date ?? r.created_at.split("T")[0],
          endDate: slots.at(-1)?.date ?? r.created_at.split("T")[0],
          cause: r.cause,
          pdfPath: r.file,
          status: r.status,
        };
        });

        setJustifications(mapped);
      } catch (e) {
        setError("Failed to load justifications.");
      } finally {
        setLoading(false);
      }
    })();
  }, [idsParam]);

  const handleAction = async (id: number, action: "accept" | "reject", note: string) => {
    try {
      const res = action === "accept"
        ? await patchJustificationAccept(id)
        : await patchJustificationRefuse(id, note);
  
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
      setJustifications(prev =>
        prev.map(j => j.id === id
          ? { ...j, status: action === "accept" ? "accepted" : "refused" }
          : j
        )
      );
      setSelected(null);
    } catch {
      alert("Action failed.");
    }
  };

  if (loading) return <p className="text-sm text-[#51689A] p-8">Loading…</p>;
  if (error) return <p className="text-sm text-red-500 p-8">{error}</p>;

  return (
    <div className="space-y-8 gap-4">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-[#1B2065] dark:text-[#EEF4F7]">Students</h1>
        <p className="text-lg text-[#51689A] dark:text-[#9BA8C4]">
          Check student justifications, refuse or accept them
        </p>
      </div>

      <div className="flex flex-row items-center gap-12">
        <ArrowLeft
          className="text-[#1B2065] dark:text-[#EEF4F7] cursor-pointer"
          size={36}
          onClick={() => router.back()}
        />
        <h1 className="text-3xl font-semibold text-[#1B2065] dark:text-[#EEF4F7]">
          {studentInfo?.name ?? studentParam ?? "Student"}
        </h1>
        <div className="flex flex-row gap-6 text-sm text-[#51689A] dark:text-[#9BA8C4]">
          <p>{studentInfo?.year ?? "—"}</p>
          <p>-</p>
          <p>{studentInfo?.group ?? "—"}</p>
          <p>-</p>
          <p>{studentInfo?.email ?? studentParam ?? ""}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-12 p-4">
        {justifications.map((j) => (
          <JustificationCard
            key={j.id}
            index={j.id}
            startDate={j.startDate}
            endDate={j.endDate}
            cause={j.cause}
            pdfPath={`${API_BASE}${j.pdfPath}`}
            onViewDetails={() => setSelected(j)}
          />
        ))}
      </div>

      {selected && (
        <AbsenceDetailsModal
          justification={selected}
          onClose={() => setSelected(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}