"use client"
import React, { useEffect, useState } from 'react';
import PdfPreview from './PdfPreview';
import { getAccessToken } from "@/lib/tokenStorage";
// export default function PdfGrid({ pdfs }: { pdfs: { url: string; title: string; date: string; professor: string }[] }) {}
type Schedule = {
  id: number;
  title: string;
  pdf: string;
  audience: "student" | "professor";
  uploaded_at: string;
};

type ApiResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Schedule[];
};
type PdfGridProps = {
  link: string;
};
export default function PdfGrid({ link }: PdfGridProps) {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
      const fetchSchedules = async () => {
        try {
          const token = getAccessToken();
          const res = await fetch(link , {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });
  
          if (!res.ok) throw new Error("Failed to fetch schedules");
  
          const data: ApiResponse = await res.json();
          setSchedules(data.results);
        } catch (err) {
          setError("Failed to load schedules");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchSchedules();
    }, []);
  
    if (loading) return <p className="text-center text-[#1B2065]">Loading schedules...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (schedules.length === 0) return <p className="text-center text-gray-400">No schedules found.</p>;
    return (
        <div className="grid grid-cols-3 gap-6 w-full mb-[4vh] max-w-5xl mx-auto px-6">
          {schedules.map((item) => (
            <div key={item.id} className="w-full flex items-center justify-center">
              <div className="w-full" style={{ containerType: "inline-size" }}>
                <div
                  style={{
                    width: "192px",
                    transform: "scale(var(--scale))",
                    transformOrigin: "top left",
                  }}
                  ref={(el) => {
                    if (!el) return;
                    const parent = el.parentElement!;
                    const scale = parent.offsetWidth / 192;
                    el.style.setProperty("--scale", String(scale));
                    parent.style.height = `${el.offsetHeight * scale}px`;
                  }}
                >
                  <PdfPreview
                    url={item.pdf}                                                      //  pdf URL from backend
                    title={item.title}                                                  //  title from backend
                    date={new Date(item.uploaded_at).toLocaleDateString("fr-FR")}      // formatted date
                    professor={item.audience === "professor" ? item.title : "N/A"}     // adjust if backend sends professor name
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
    );
}