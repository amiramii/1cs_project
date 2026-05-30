"use client";

import CsvUploadSection from "@/app/_components/admin/CsvUploadSection";

type Props = {
  stagedCsv?: File | null;
  onStagedCsvChange?: (file: File | null) => void;
};

export default function MiddleContainer(props: Props) {
  return (
    <CsvUploadSection
      userType="student"
      stagedCsv={props.stagedCsv}
      onStagedCsvChange={props.onStagedCsvChange}
      copy={{
        en: {
          hint: 'Drop a CSV anywhere on this page to select it, then click "Add students" to import students into the database.',
          submit: "Add students",
          importing: "Importing…",
          createdLabel: "new student account(s)",
        },
        ar: {
          hint: "اسحب ملف CSV في أي مكان في الصفحة لتحديده، ثم اضغط «إضافة طلاب» لاستيراد الطلاب إلى قاعدة البيانات.",
          submit: "إضافة طلاب",
          importing: "جارٍ الاستيراد…",
          createdLabel: "حساب طالب جديد",
        },
      }}
    />
  );
}
