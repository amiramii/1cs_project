"use client";

import React, { useState } from 'react';
import { ArrowLeft, SquarePen, X } from "lucide-react";
import { useRouter } from "next/navigation";
import JustificationCard from "./JustificationCard";

interface Justification {
  index: number;
  startDate: string;
  endDate: string;
  cause: string;
  pdfPath: string;
  onViewDetails?: () => void;
}

const justifications: Justification[] = [
  { index: 1, startDate: "01/02/2026", endDate: "04/02/2026", cause: "Illness (Cold)", pdfPath: "/justmed.pdf" },
  { index: 2, startDate: "10/03/2026", endDate: "11/03/2026", cause: "Family emergency", pdfPath: "/justmed.pdf" },
];

interface ModalProps {
  justification: Justification;
  onClose: () => void;
}

function AbsenceDetailsModal({ justification, onClose }: ModalProps) {
  const router = useRouter();
  const [note, setNote] = useState("");

  const handleAction = () => {
    router.push("/Justifications");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1A2036] rounded-2xl shadow-2xl w-[820px] max-w-[95vw] flex flex-row overflow-hidden relative">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-white dark:bg-[#1A2036] border border-[#e0e7f0] rounded-full p-1.5 shadow hover:bg-gray-100 transition z-10"
        >
          <X size={18} className="text-[#1B2065] dark:text-[#EEF4F7]" />
        </button>

        {/* Left: Document preview */}
        <div className="w-[48%] bg-[#f4f6fb] flex items-center justify-center p-6">
          <iframe
            src="/justmed.pdf"
            className="w-full h-full rounded-xl shadow-md bg-white dark:bg-[#1A2036]"
          />
        </div>

        {/* Right: Details */}
        <div className="w-[52%] flex flex-col p-8 gap-5">
          <h2 className="text-2xl font-bold text-[#1B2065] dark:text-[#EEF4F7]">Absences details</h2>

          <div>
            <p className="text-sm text-[#51689A] dark:text-[#9BA8C4] mb-1">Absence date :</p>
            <p className="text-lg font-semibold text-[#4e7de0]">
              {justification.startDate} - {justification.endDate}
            </p>
          </div>

          <div>
            <p className="text-sm text-[#51689A] dark:text-[#9BA8C4] mb-1">Absence cause :</p>
            <p className="text-base font-semibold text-[#1B2065] dark:text-[#EEF4F7]">{justification.cause}</p>
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
              onClick={handleAction}
              className="flex-1 border border-[#4e7de0] text-[#4e7de0] font-semibold py-2.5 rounded-xl hover:bg-[#eef2fb] transition text-sm"
            >
              Accept
            </button>
            <button
              onClick={handleAction}
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
  const [selected, setSelected] = useState<Justification | null>(null);

  return (
    <div className="space-y-8 gap-4">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-[#1B2065] dark:text-[#EEF4F7]">Students</h1>
        <p className="text-lg text-[#51689A] dark:text-[#9BA8C4]">
          check student justifications, refuse or accept them
        </p>
      </div>

      <div className="flex flex-row items-center gap-12">
        <ArrowLeft className="text-[#1B2065] dark:text-[#EEF4F7] cursor-pointer" size={36} />
        <h1 className="text-3xl font-semibold text-[#1B2065] dark:text-[#EEF4F7]">Bensaber Mohammed</h1>
        <div className="flex flex-row gap-6 text-sm text-[#51689A] dark:text-[#9BA8C4]">
          <p>2CS</p>
          <p>-</p>
          <p>G2</p>
          <p>-</p>
          <p>m.bensaber@esi-sba.dz</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-12 p-4">
        {justifications.map((j) => (
          <JustificationCard
            key={j.index}
            index={j.index}
            startDate={j.startDate}
            endDate={j.endDate}
            cause={j.cause}
            pdfPath={j.pdfPath}
            onViewDetails={() => setSelected(j)}
          />
        ))}
      </div>

      {selected && (
        <AbsenceDetailsModal
          justification={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}