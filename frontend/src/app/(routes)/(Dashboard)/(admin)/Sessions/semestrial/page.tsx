"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/app/_components/language-provider";

function Fallback() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  return (
    <div className="flex min-h-[12rem] items-center justify-center text-sm text-muted-foreground">
      {isAr ? "جارٍ التحميل…" : "Loading…"}
    </div>
  );
}

function RedirectToStudentsSheet() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const query = params.toString();
    router.replace(`/Students/semestrial${query ? `?${query}` : ""}`);
  }, [params, router]);

  return <Fallback />;
}

export default function SemestrialRoutePage() {
  return (
    <Suspense fallback={<Fallback />}>
      <RedirectToStudentsSheet />
    </Suspense>
  );
}
