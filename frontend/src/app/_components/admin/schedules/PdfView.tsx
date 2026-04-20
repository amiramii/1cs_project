"use client"

import React, { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type DbFile = {
  id: string
  url: string
  title: string
}

export default function PdfView() {
  const [dbFiles] = useState<DbFile[]>([
    { id: "initial", url: "/test.pdf", title: "Default Document" },
    {
      id: "1",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      title: "DB File 1",
    },
    {
      id: "2",
      url: "https://pdfobject.com/pdf/sample.pdf",
      title: "DB File 2",
    },
  ])

  const [currentIndex, setCurrentIndex] = useState(0)

  const goToNext = () => {
    if (currentIndex < dbFiles.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const currentFile = dbFiles[currentIndex]

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-lg border border-border bg-muted/40">
        <CardContent className="flex flex-row items-center justify-between gap-3 p-3 sm:p-4">
          <Button
            type="button"
            variant="outline"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="shrink-0"
          >
            ← Previous
          </Button>

          <span className="min-w-0 flex-1 text-center text-sm font-semibold text-foreground sm:text-base">
            {currentFile.title} ({currentIndex + 1} of {dbFiles.length})
          </span>

          <Button
            type="button"
            variant="outline"
            onClick={goToNext}
            disabled={currentIndex === dbFiles.length - 1}
            className="shrink-0"
          >
            Next →
          </Button>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-lg border border-border" style={{ height: "75vh" }}>
        <iframe
          key={currentFile.url}
          src={`${currentFile.url}#toolbar=0`}
          width="100%"
          height="100%"
          className="border-0"
          title={currentFile.title}
        />
      </div>
    </div>
  )
}
