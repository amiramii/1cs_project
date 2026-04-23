"use client";

import TotalStaff from "../TotalStaff";
import { CircleCheckBig, ClipboardList, MailWarning, Users } from "lucide-react";
import { useLanguage } from "@/app/_components/language-provider";

export default function StudTotals() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  return (
    <section
      className="relative mx-auto w-full min-w-0 max-w-6xl overflow-hidden rounded-2xl border border-[#74A7BD]/25 bg-gradient-to-br from-[#74A7BD]/10 via-[#FEF9F9] to-[#FEF9F9] p-4 shadow-sm md:p-5"
    >
      <div className="pointer-events-none absolute -end-16 top-0 h-44 w-44 rounded-full bg-fuchsia-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -end-20 top-8 h-48 w-48 rounded-full bg-[#74A7BD]/12 blur-3xl" />
      <div className="pointer-events-none absolute end-8 bottom-0 h-32 w-32 rounded-full bg-sky-200/25 blur-2xl" />
      <div className="relative z-10 grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <TotalStaff
          showMenu={false}
          label={isArabic ? "إجمالي الطلاب" : "Total Students"}
          icon={<Users strokeWidth={1.75} />}
          count={1900}
          footer={
            <p className="flex flex-wrap items-center gap-1.5 text-[#1B2559]">
              <ClipboardList
                className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"
                strokeWidth={2}
              />
              <span className="font-semibold">1700</span>
              <span className="font-medium text-[#6CB4B4]">
                {isArabic ? "نشط" : "Active"}
              </span>
              <span className="font-semibold">200</span>
              <span className="font-medium text-[#6CB4B4]">
                {isArabic ? "غير نشط" : "Inactive"}
              </span>
            </p>
          }
        />
        <TotalStaff
          showMenu={false}
          label={isArabic ? "غياب غير مبرر" : "Unjustified Absences"}
          icon={<MailWarning strokeWidth={1.75}  />}
          count={192}
          footer={
            <p>
              <span className="font-bold text-[#EE5D50]">12%</span>{" "}
              <span className="text-[#707EAE]">
                {isArabic ? "في المتوسط سنويًا" : "On average for each year"}
              </span>
            </p>
          }
        />
        <TotalStaff
          showMenu={false}
          label={isArabic ? "معدل الغياب المبرر" : "Justified Absence Rate"}
          icon={<CircleCheckBig strokeWidth={1.75} />}
          count="83.8%"
          footer={
            <p className="font-medium text-[#6CB4B4]">
              {isArabic ? "من إجمالي الغياب" : "Of all absences"}
            </p>
          }
        />
      </div>
    </section>
  );
}
