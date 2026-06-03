"use client"
import React, { useEffect, useState } from 'react';
import PdfPreview from './PdfPreview';
import { getAccessToken } from "@/lib/tokenStorage";
import { getScheduleFileFetchUrl } from "@/lib/scheduleMediaUrl";
import { useLanguage } from "@/app/_components/language-provider";
// export default function PdfGrid({ pdfs }: { pdfs: { url: string; title: string; date: string; professor: string }[] }) {}
type Schedule = {
  id: number | string;
  title: string;
  pdf: string;
  audience: "student" | "teacher" | "professor";
  uploaded_at: string;
};

type ApiResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Schedule[];
};
type PdfGridProps = {
  link?: string;
  schedules?: Schedule[];
};

export default function PdfGrid({ link, schedules: schedulesProp }: PdfGridProps) {
    const [schedules, setSchedules] = useState<Schedule[]>(schedulesProp ?? []);
    const [loading, setLoading] = useState(!schedulesProp && Boolean(link));
    const [error, setError] = useState<string | null>(null);
    const { language } = useLanguage();
    const isArabic = language === "ar";

const normalizePdfUrl = (rawUrl: string) => {
  if (!rawUrl) return rawUrl
  return getScheduleFileFetchUrl(rawUrl)
}

    useEffect(() => {
    if (schedulesProp !== undefined) {
    setSchedules(schedulesProp);
    setLoading(false);
    return;
  }
  if (!link) {
    setSchedules([]);
    setLoading(false);
    setError(null);
    return;
  }

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAccessToken();
      const res = await fetch(link, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch schedules");
      const data: ApiResponse = await res.json();
      const remoteSchedules = (data.results ?? []).map((item) => ({
        ...item,
        pdf: normalizePdfUrl(item.pdf),
      }))
      setSchedules(remoteSchedules);
    } catch (err) {
      setError(isArabic ? "تعذر تحميل جداول الخادم." : "Could not load server schedules.");
      console.error(err);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  fetchSchedules();
}, [isArabic, link, schedulesProp]);
  
    if (loading) return <p className="py-6 text-center text-muted-foreground">{isArabic ? "جارٍ تحميل الجداول..." : "Loading schedules..."}</p>;
    if (schedules.length === 0) return <p className="py-6 text-center text-muted-foreground">{isArabic ? "لا توجد جداول." : "No schedules found."}</p>;
    return (
        <>
          {error && (
            <p className="pb-3 text-center text-xs text-[#E7CE51]">
              {error}
            </p>
          )}
          <div className="grid w-full grid-cols-1 gap-3 pb-4 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-4">
            {schedules.map((item) => (
              <div key={item.id} className="w-full">
                <PdfPreview
                  url={item.pdf}
                  title={item.title}
                  date={new Date(item.uploaded_at).toLocaleDateString("fr-FR")}
                  professor={item.audience === "teacher" || item.audience === "professor" ? item.title : (isArabic ? "غير متوفر" : "N/A")}
                />
              </div>
            ))}
          </div>
        </>
    );
}
 