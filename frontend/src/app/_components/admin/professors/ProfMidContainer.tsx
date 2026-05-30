"use client";

import CsvUploadSection from "@/app/_components/admin/CsvUploadSection";

type Props = {
  stagedCsv?: File | null;
  onStagedCsvChange?: (file: File | null) => void;
};

export default function MiddleContainer(props: Props) {
  return (
    <CsvUploadSection
      userType="teacher"
      stagedCsv={props.stagedCsv}
      onStagedCsvChange={props.onStagedCsvChange}
      copy={{
        en: {
          hint: 'Drop a CSV anywhere on this page to select it, then click "Add Professor" to import teachers into the database.',
          submit: "Add Professor",
          importing: "Importing…",
          createdLabel: "new professor account(s)",
        },
        ar: {
          hint: "اسحب ملف CSV في أي مكان في الصفحة لتحديده، ثم اضغط «إضافة أستاذ» لاستيراد الأساتذة إلى قاعدة البيانات.",
          submit: "إضافة أستاذ",
          importing: "جارٍ الاستيراد…",
          createdLabel: "حساب أستاذ جديد",
        },
      }}
    />
  );
}
