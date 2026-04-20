"use client";

import TotalStaff from "../TotalStaff";
import {Users , BookMarked , Activity}   from "lucide-react";
import { useLanguage } from "@/app/_components/language-provider";

export default function ProfTotals() {
    const { language } = useLanguage();
    const isArabic = language === "ar";
    return (
        <section className="mx-auto grid w-full min-w-0 max-w-full grid-cols-1 gap-3 sm:grid-cols-2 md:w-11/12 lg:w-9/12 xl:w-8/12 xl:grid-cols-3">
        <TotalStaff
          label={isArabic ? "إجمالي الأساتذة" : "Total Professors"}
          icon={<Users />}
          count={1900}
          details={isArabic ? "نشط" : "Active"}
        />
        <TotalStaff
          label={isArabic ? "إجمالي المواد" : "Total Modules"}
          icon={<BookMarked />}
          count={50}
          details={isArabic ? "متاح" : "Available"}
        />
        <TotalStaff
          label={isArabic ? "متوسط الغياب" : "Average Absence"}
          icon={<Activity />}
          count="15%"
          details={isArabic ? "منخفض" : "Low"}
        />
        </section>
    );
}

// import TotalStaff from '@/components/TotalStaff';
// import { UserIcon, FileTextIcon } from 'lucide-react'; // Example icons

// export default function Dashboard() {
//   return (
//     <div className="p-10 space-y-8">
//       {/* Example 1: Staff PDFs */}
//       <TotalStaff 
//         label="Staff Records" 
//         backendUrl="https://your-api.com/v1/staff-pdfs" 
//         icon={<UserIcon size={20} />}
//       />

//       {/* Example 2: Financial Reports */}
//       <TotalStaff 
//         label="Monthly Reports" 
//         backendUrl="https://your-api.com/v1/reports" 
//         icon={<FileTextIcon size={20} />}
//       />
//     </div>
//   );
// }