"use client";

import CsvUploadSection from "@/app/_components/admin/CsvUploadSection";

type Props = {
  stagedCsv?: File | null;
  onStagedCsvChange?: (file: File | null) => void;
};

export default function MiddleContainer(props: Props) {
  return (
    <CsvUploadSection
      userType="schooling"
      stagedCsv={props.stagedCsv}
      onStagedCsvChange={props.onStagedCsvChange}
      copy={{
        en: {
          hint: 'Drop a CSV anywhere on this page to select it, then click "Add Schooling" to import schooling staff into the database.',
          submit: "Add Schooling",
          importing: "Importing…",
          createdLabel: "new schooling account(s)",
        },
        ar: {
          hint: "اسحب ملف CSV في أي مكان في الصفحة لتحديده، ثم اضغط «إضافة طاقم تعليم» لاستيراد الموظفين إلى قاعدة البيانات.",
          submit: "إضافة طاقم تعليم",
          importing: "جارٍ الاستيراد…",
          createdLabel: "حساب طاقم تعليم جديد",
        },
      }}
    />
  );
}
