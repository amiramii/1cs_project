"use client";

import TotalStaff from "../TotalStaff";
import { Users, MailWarning, CircleCheckBig } from "lucide-react";
import { useLanguage } from "@/app/_components/language-provider";

export default function StudTotals() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  return (
    <section className="mx-auto grid w-full  max-w-full grid-cols-1 gap-3 sm:grid-cols-2 md:w-11/12 lg:w-9/12 xl:w-11/12 xl:grid-cols-3">
      <TotalStaff
        label={isArabic ? "إجمالي الطلاب" : "Total Students"}
        icon={<Users />}
        count={1900}
        details={isArabic ? "نشط" : "Active"}
      />
      <TotalStaff
        label={isArabic ? "غياب غير مبرر" : "Unjustified Absences"}
        icon={<MailWarning />}
        count={50}
        details={isArabic ? "مسجّل" : "Recorded"}
      />
      <TotalStaff
        label={isArabic ? "معدل الغياب المبرر" : "Justified Absence Rate"}
        icon={<CircleCheckBig />}
        count="15%"
        details={isArabic ? "منخفض" : "Low"}
      />
    </section>
  );
}
