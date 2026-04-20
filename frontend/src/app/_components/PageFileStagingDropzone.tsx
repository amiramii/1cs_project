"use client";

import { useDropzone, type DropzoneOptions } from "react-dropzone";
import { useLanguage } from "@/app/_components/language-provider";

type Props = {
  onFileStaged: (file: File) => void;
  accept?: DropzoneOptions["accept"];
  children: React.ReactNode;
  className?: string;
};

/**
 * Full-area drag-and-drop (no click-to-open on the overlay — use inner controls for that).
 * Stages a file so the user can confirm with a primary action button.
 */
export default function PageFileStagingDropzone({
  onFileStaged,
  accept,
  children,
  className = "",
}: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      if (files[0]) onFileStaged(files[0]);
    },
    noClick: true,
    noKeyboard: true,
    multiple: false,
    accept,
  });

  return (
    <div
      {...getRootProps({
        className: `relative w-full rounded-xl transition-colors ${isDragActive ? "bg-primary/5 ring-2 ring-dashed ring-primary" : ""} ${className}`,
      })}
    >
      <input {...getInputProps()} />
      {isDragActive && (
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center rounded-xl bg-background/75 backdrop-blur-[2px]">
          <p className="rounded-lg border border-primary bg-card px-4 py-3 text-center text-sm font-medium shadow-md">
            {isAr ? "أفلت الملف لإرفاقه — ثم اضغط الزر للحفظ" : "Drop the file to attach — then click the button to save"}
          </p>
        </div>
      )}
      {children}
    </div>
  );
}
