'use client'

import React, { useEffect, useState } from 'react'
import { getAccessToken } from "@/lib/tokenStorage"
import { useLanguage } from "@/app/_components/language-provider"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type PdfPreviewProps = {
  url: string
  title?: string
  date?: string
  professor?: string
  width?: number | string
  thumbnailWidth?: number
  height?: number
}

function fileKindFromUrl(url: string): "pdf" | "spreadsheet" {
  const path = url.split("?")[0].split("#")[0].toLowerCase()
  if (path.endsWith(".pdf")) return "pdf"
  if (/\.(xlsx|xls|csv|ods)$/.test(path)) return "spreadsheet"
  return "pdf"
}

function extensionForDownload(url: string, kind: "pdf" | "spreadsheet"): string {
  const path = url.split("?")[0].split("#")[0].toLowerCase()
  const m = path.match(/(\.[a-z0-9]+)$/)
  if (m) return m[1]
  return kind === "pdf" ? ".pdf" : ".xlsx"
}

export default function PdfPreview({
  url,
  title = "Schedule Title",
  date = "01/01/2026",
  professor = "Prof Moh",
  width = "100%",
  height = 160,
}: PdfPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loadingDoc, setLoadingDoc] = useState(false)
  const [viewerFailed, setViewerFailed] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const { language } = useLanguage()
  const isArabic = language === "ar"
  const isLocalAsset = url.startsWith("/")
  const kind = fileKindFromUrl(url)

  useEffect(() => {
    if (!isOpen) return
    if (kind !== "pdf") {
      setLoadingDoc(false)
      setBlobUrl(null)
      setViewerFailed(false)
      return
    }

    if (isLocalAsset) {
      setLoadingDoc(false)
      setViewerFailed(false)
      setBlobUrl(null)
      return
    }

    let active = true
    let nextBlobUrl: string | null = null

    const fetchBlob = async () => {
      try {
        setViewerFailed(false)
        setLoadingDoc(true)
        const token = getAccessToken()
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error("Failed to load schedule file")
        const blob = await res.blob()
        nextBlobUrl = URL.createObjectURL(blob)
        if (active) setBlobUrl(nextBlobUrl)
      } catch (err) {
        console.error("Failed to load file blob:", err)
        if (active) setBlobUrl(null)
      } finally {
        if (active) setLoadingDoc(false)
      }
    }

    fetchBlob()
    return () => {
      active = false
      if (nextBlobUrl) URL.revokeObjectURL(nextBlobUrl)
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [isLocalAsset, isOpen, kind, url])

  const pdfHash = "toolbar=0&navpanes=0&scrollbar=0&view=FitH"
  const iframeSrc =
    kind === "pdf" && !isLocalAsset && blobUrl ? `${blobUrl}#${pdfHash}` : null

  const runDownload = async () => {
    try {
      setDownloading(true)
      const token = getAccessToken()
      const fetchUrl = isLocalAsset ? `${window.location.origin}${url}` : url
      const res = await fetch(fetchUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Download failed")
      const blob = await res.blob()
      const ext = extensionForDownload(url, kind)
      const safe = title.replace(/[^\w\s\-().]/g, "_").trim() || "schedule"
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = objectUrl
      a.download = `${safe}${ext}`
      a.rel = "noopener"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (e) {
      console.error(e)
    } finally {
      setDownloading(false)
    }
  }

  const PlaceholderIcon =
    kind === "spreadsheet" ? (
      <FileSpreadsheet className="h-10 w-10 text-muted-foreground/80" aria-hidden />
    ) : (
      <FileText className="h-10 w-10 text-muted-foreground/80" aria-hidden />
    )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={`group flex h-auto cursor-pointer flex-col text-start transition-transform hover:scale-[1.02] hover:bg-transparent ${
            isOpen ? "rounded-md ring-2 ring-[#39A5FF] ring-offset-2 ring-offset-background" : ""
          }`}
          style={{ width }}
        >
        <div
          className="relative flex w-full items-center justify-center overflow-hidden rounded-t-md border border-border bg-muted/80 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ height }}
        >
          {PlaceholderIcon}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="rounded-md border border-[#51689A]/60 bg-white/80 px-3 py-1 text-xs font-semibold text-[#1B2065F2] backdrop-blur-sm">
              {isArabic ? "فتح" : "Open"}
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col rounded-b-lg border border-border bg-card">
          <div className="flex w-full items-center justify-center border-b border-border px-2 py-1 text-center text-[10px] font-semibold text-foreground">
            {date}
          </div>
          <div className="flex w-full items-center justify-center bg-primary px-2 py-1.5 text-center text-xs font-medium text-primary-foreground">
            {title}
          </div>
        </div>
      </Button>
      </DialogTrigger>

      <DialogContent className="grid h-[100dvh] max-h-[100dvh] max-w-[97vw] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden border-border/50 bg-card/95 p-0 supports-backdrop-filter:backdrop-blur-md sm:max-w-6xl">
        <DialogHeader className="border-b border-border/70 px-5 py-3">
          <DialogTitle className="truncate text-sm sm:text-base">{title}</DialogTitle>
          <DialogDescription className="truncate text-xs sm:text-sm">
            {isArabic ? "المدرس" : "Teacher"}: {professor} - {date}
          </DialogDescription>
        </DialogHeader>

        <div className="h-full min-h-0 overflow-hidden bg-muted/30 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {kind === "spreadsheet" ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <FileSpreadsheet className="h-16 w-16 text-muted-foreground" aria-hidden />
              <p className="max-w-md text-sm text-muted-foreground">
                {isArabic
                  ? "ملف Excel — استخدم زر التحميل لحفظه على جهازك."
                  : "Spreadsheet file — use Download to save it to your device."}
              </p>
            </div>
          ) : isLocalAsset ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isArabic
                  ? "معاينة الملفات المحلية غير متاحة. استخدم التحميل."
                  : "Local file preview is not available. Use download."}
              </p>
            </div>
          ) : iframeSrc && !viewerFailed ? (
            <iframe
              src={iframeSrc}
              width="100%"
              height="100%"
              title={title}
              scrolling="no"
              className="h-full min-h-0 w-full overflow-hidden border-none object-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              onError={() => setViewerFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4">
              {loadingDoc ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-primary" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isArabic
                    ? "تعذر عرض الملف هنا. استخدم التحميل."
                    : "Could not preview this file. Use download below."}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center border-t border-border/70 px-5 py-3">
          <Button
            type="button"
            disabled={downloading}
            onClick={runDownload}
            className="bg-[#51689A] text-white hover:bg-[#445680] hover:text-white"
          >
            <Download size={14} />
            {downloading
              ? isArabic
                ? "جارٍ التحميل..."
                : "Downloading..."
              : isArabic
                ? "تحميل"
                : "Download"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
