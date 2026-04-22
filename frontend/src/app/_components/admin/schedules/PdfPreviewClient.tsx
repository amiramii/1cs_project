'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { getScheduleFileFetchUrl } from '@/lib/scheduleMediaUrl'
import { getAccessToken } from '@/lib/tokenStorage'
import { useLanguage } from '@/app/_components/language-provider'
import { Download, FileSpreadsheet, FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
}

export type PdfPreviewProps = {
  url: string
  title?: string
  date?: string
  professor?: string
  width?: number | string
  height?: number
  onDelete?: () => void | Promise<void>
  deletePending?: boolean
  /** `stacked`: date row only, then navy footer with title (prof schedules tab design). */
  cardLayout?: "default" | "stacked"
}

function fileKindFromUrl(url: string): 'pdf' | 'spreadsheet' {
  const path = url.split('?')[0]?.split('#')[0]?.toLowerCase() ?? ''
  if (path.endsWith('.pdf')) return 'pdf'
  if (/\.(xlsx|xls|csv|ods)$/.test(path)) return 'spreadsheet'
  return 'pdf'
}

function extensionForDownload(url: string, kind: 'pdf' | 'spreadsheet'): string {
  const path = url.split('?')[0]?.split('#')[0]?.toLowerCase() ?? ''
  const m = path.match(/(\.[a-z0-9]+)$/)
  if (m) return m[1]
  return kind === 'pdf' ? '.pdf' : '.xlsx'
}

function looksLikePdfBytes(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 4) return false
  const u = new Uint8Array(buf.slice(0, 4))
  return u[0] === 0x25 && u[1] === 0x50 && u[2] === 0x44 && u[3] === 0x46
}

function looksLikeZipBytes(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 2) return false
  const u = new Uint8Array(buf.slice(0, 2))
  return u[0] === 0x50 && u[1] === 0x4b
}

function looksLikeHtmlBytes(buf: ArrayBuffer): boolean {
  const dec = new TextDecoder('utf-8', { fatal: false })
  const head = dec
    .decode(buf.byteLength > 512 ? buf.slice(0, 512) : buf)
    .trimStart()
    .toLowerCase()
  return head.startsWith('<!doctype html') || head.startsWith('<html')
}

function resolvePreview(
  buf: ArrayBuffer,
  contentTypeHeader: string | null
): { mode: 'pdf'; blob: Blob } | { mode: 'spreadsheet' } | { mode: 'error' } {
  if (buf.byteLength === 0) {
    return { mode: 'error' }
  }

  const ct = contentTypeHeader?.split(';')[0]?.trim().toLowerCase() ?? ''

  if (ct.includes('text/html') || looksLikeHtmlBytes(buf)) {
    return { mode: 'error' }
  }

  if (ct.includes('spreadsheet') || ct.includes('ms-excel') || ct.includes('csv')) {
    return { mode: 'spreadsheet' }
  }

  if (ct.includes('pdf') || looksLikePdfBytes(buf)) {
    return { mode: 'pdf', blob: new Blob([buf], { type: 'application/pdf' }) }
  }

  if (ct.includes('octet-stream') || ct === '') {
    if (looksLikePdfBytes(buf)) {
      return { mode: 'pdf', blob: new Blob([buf], { type: 'application/pdf' }) }
    }
    if (looksLikeZipBytes(buf)) {
      return { mode: 'spreadsheet' }
    }
  }

  return { mode: 'pdf', blob: new Blob([buf], { type: 'application/pdf' }) }
}

const navy = '#1B2065'
const slateBtn = '#51689A'

export default function PdfPreviewClient({
  url,
  title = 'Schedule Title',
  date = '01/01/2026',
  professor = 'Prof Moh',
  width = '100%',
  height = 168,
  onDelete,
  deletePending = false,
  cardLayout = 'default',
}: PdfPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [viewerObjectUrl, setViewerObjectUrl] = useState<string | null>(null)
  const [loadingRemote, setLoadingRemote] = useState(false)
  const [viewerFailed, setViewerFailed] = useState(false)
  const [thumbDocFailed, setThumbDocFailed] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [resolvedKind, setResolvedKind] = useState<'pdf' | 'spreadsheet' | null>(null)
  const [loadError, setLoadError] = useState(false)
  const thumbHostRef = useRef<HTMLDivElement | null>(null)
  const [thumbSize, setThumbSize] = useState<{ w: number; h: number }>({ w: 0, h: height })

  const { language } = useLanguage()
  const isArabic = language === 'ar'
  const isLocalAsset = url.startsWith('/')
  const urlKind = fileKindFromUrl(url)
  const effectiveKind = resolvedKind ?? urlKind

  useEffect(() => {
    setThumbDocFailed(false)
    setLoadError(false)
    setPreviewBlob(null)
    setResolvedKind(null)

    if (isLocalAsset) {
      setResolvedKind(urlKind === 'spreadsheet' ? 'spreadsheet' : null)
      setLoadingRemote(false)
      return
    }

    if (urlKind === 'spreadsheet') {
      setResolvedKind('spreadsheet')
      setLoadingRemote(false)
      return
    }

    let cancelled = false
    setLoadingRemote(true)

    ;(async () => {
      try {
        const token = getAccessToken()
        const fetchUrl = getScheduleFileFetchUrl(url)
        const res = await fetch(fetchUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error('fetch failed')
        const contentType = res.headers.get('content-type')
        const buf = await res.arrayBuffer()
        if (cancelled) return
        const resolved = resolvePreview(buf, contentType)
        if (resolved.mode === 'error') {
          setLoadError(true)
          return
        }
        if (resolved.mode === 'spreadsheet') {
          setResolvedKind('spreadsheet')
          return
        }
        if (resolved.blob.size === 0) {
          setLoadError(true)
          return
        }
        setResolvedKind('pdf')
        setPreviewBlob(resolved.blob)
      } catch (err) {
        console.error('Failed to load schedule file:', err)
        if (!cancelled) setLoadError(true)
      } finally {
        if (!cancelled) setLoadingRemote(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [url, isLocalAsset, urlKind])

  useLayoutEffect(() => {
    const el = thumbHostRef.current
    if (!el) return
    const read = () => {
      const r = el.getBoundingClientRect()
      setThumbSize({
        w: Math.max(0, Math.floor(r.width)),
        h: Math.max(0, Math.floor(r.height)),
      })
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [height])

  useEffect(() => {
    if (!isOpen || effectiveKind !== 'pdf' || !previewBlob || previewBlob.size === 0) {
      setViewerObjectUrl(null)
      return
    }
    const u = URL.createObjectURL(previewBlob)
    setViewerObjectUrl(u)
    return () => {
      URL.revokeObjectURL(u)
    }
  }, [isOpen, effectiveKind, previewBlob])

  const pdfHash = 'toolbar=0&navpanes=0&scrollbar=0&view=FitH'
  const iframeSrc =
    effectiveKind === 'pdf' && !isLocalAsset && viewerObjectUrl
      ? `${viewerObjectUrl}#${pdfHash}`
      : null

  const runDownload = async () => {
    try {
      setDownloading(true)
      const extKind = fileKindFromUrl(url)
      const ext = extensionForDownload(url, extKind)
      const safe = title.replace(/[^\w\s\-().]/g, '_').trim() || 'schedule'

      if (previewBlob && effectiveKind === 'pdf' && previewBlob.size > 0) {
        const objectUrl = URL.createObjectURL(previewBlob)
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = `${safe}${ext}`
        a.rel = 'noopener'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(objectUrl)
        return
      }

      const token = getAccessToken()
      const fetchUrl = isLocalAsset
        ? `${window.location.origin}${url}`
        : getScheduleFileFetchUrl(url)
      const res = await fetch(fetchUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      if (blob.size === 0) throw new Error('Empty file')
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `${safe}${ext}`
      a.rel = 'noopener'
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

  const requestDelete = () => {
    if (!onDelete) return
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    setDeleteConfirmOpen(false)
    try {
      await onDelete?.()
    } catch (e) {
      console.error(e)
    }
  }

  const PlaceholderIcon =
    urlKind === 'spreadsheet' ? (
      <FileSpreadsheet className="h-10 w-10 text-muted-foreground/80" aria-hidden />
    ) : (
      <FileText className="h-10 w-10 text-muted-foreground/80" aria-hidden />
    )

  const showPdfThumb =
    !isLocalAsset &&
    effectiveKind === 'pdf' &&
    previewBlob &&
    previewBlob.size > 0 &&
    !loadError &&
    !thumbDocFailed

  const hoverBtnClass =
    'pointer-events-auto rounded-md border-[1px] border-[#1B2065] bg-card/10 backdrop-blur-sm px-3 py-2 text-xs font-semibold text-[#1B2065] shadow-sm transition-colors hover:bg-white sm:px-4 sm:text-sm'

  return (
    <>
      <div
        className={cn(
          'relative flex w-full flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm transition-[box-shadow,ring]',
          isOpen && 'ring-[3px] ring-[#74A7BD] ring-offset-2 ring-offset-background'
        )}
        style={{ width }}
      >
        <div
          ref={thumbHostRef}
          className="relative flex w-full items-stretch justify-stretch overflow-hidden bg-slate-100/90 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ height, minHeight: height }}
        >
          {onDelete ? (
            <button
              type="button"
              disabled={deletePending}
              className="absolute end-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-card/80 backdrop-blur-3xl text-[#1B2065] shadow-sm transition-colors hover:bg-white disabled:opacity-50"
              title={isArabic ? 'حذف' : 'Delete'}
              aria-label={isArabic ? 'حذف الجدول' : 'Delete schedule'}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                requestDelete()
              }}
            >
              {deletePending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1B2065]/30 border-t-[#1B2065]" />
              ) : (
                <Trash2 className="h-4 w-4" aria-hidden />
              )}
            </button>
          ) : null}

          <div
            className="group relative flex min-h-[inherit] w-full cursor-pointer items-start justify-center overflow-hidden"
            onClick={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setIsOpen(true)
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={isArabic ? 'فتح المعاينة' : 'Open schedule preview'}
          >
          <div className="flex h-full min-h-0 w-full min-w-0 items-start justify-center transition duration-200 group-hover:blur-[2px]">
            {loadingRemote && urlKind === 'pdf' && !isLocalAsset ? (
              <div className="mt-8 h-7 w-7 shrink-0 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-primary" />
            ) : showPdfThumb ? (
              <Document
                file={previewBlob}
                loading={null}
                onLoadError={() => setThumbDocFailed(true)}
                className="flex h-full min-h-0 w-full min-w-0 items-start justify-center overflow-hidden [&_.react-pdf__Page]:!m-0 [&_.react-pdf__Page]:box-border [&_.react-pdf__Page]:max-h-none [&_.react-pdf__Page]:max-w-full"
              >
                <Page
                  pageNumber={1}
                  width={thumbSize.w > 8 ? thumbSize.w : undefined}
                  height={thumbSize.w > 8 ? undefined : height}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="!w-full !max-w-full !bg-transparent !shadow-none [&_.react-pdf__Page__canvas]:!h-auto [&_.react-pdf__Page__canvas]:!max-w-full [&_.react-pdf__Page__canvas]:object-contain [&_.react-pdf__Page__canvas]:object-top"
                />
              </Document>
            ) : (
              <span className="mt-8">{PlaceholderIcon}</span>
            )}
          </div>

          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 bg-card/10 backdrop-blur-sm opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
            <button
              type="button"
              className={hoverBtnClass}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsOpen(true)
              }}
            >
              {isArabic ? 'فتح' : 'Open'}
            </button>
            <button
              type="button"
              className={cn(hoverBtnClass, 'inline-flex items-center gap-1.5')}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void runDownload()
              }}
            >
              <Download className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
              {isArabic ? 'تحميل' : 'Download'}
            </button>
          </div>
          </div>
        </div>

        {cardLayout === 'stacked' ? (
          <div className="border-t border-slate-200 bg-white py-2.5 text-center text-sm font-semibold tabular-nums text-[#1B2065]">
            {date}
          </div>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-slate-300 bg-white py-2 text-center text-[11px] font-semibold text-[#1B2065] sm:text-xs">
            <div className="truncate px-2">{date}</div>
            <div className="truncate px-2" title={professor}>
              {professor}
            </div>
          </div>
        )}

        <div
          className="px-3 py-2.5 text-center text-xs font-semibold leading-snug text-white sm:text-sm"
          style={{ backgroundColor: navy }}
        >
          {title}
        </div>
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open)
          if (open) setViewerFailed(false)
        }}
      >
        <DialogContent
          showCloseButton
          className={cn(
            '!flex min-h-0 w-full flex-col gap-0 overflow-hidden rounded-xl border-slate-200 p-0',
            'h-[min(88dvh,calc(100dvh-2.5rem))] max-h-[calc(100dvh-2.5rem)]',
            '!max-w-[min(80rem,calc(100vw-2rem))]'
          )}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <div className="relative min-h-0 flex-1 overflow-hidden bg-slate-100/80 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {effectiveKind === 'spreadsheet' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <FileSpreadsheet className="h-16 w-16 text-muted-foreground" aria-hidden />
                <p className="max-w-md text-sm text-muted-foreground">
                  {isArabic
                    ? 'ملف Excel — استخدم زر التحميل أدناه.'
                    : 'Spreadsheet file — use Download below.'}
                </p>
              </div>
            ) : isLocalAsset ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {isArabic
                    ? 'معاينة الملفات المحلية غير متاحة.'
                    : 'Local file preview is not available.'}
                </p>
              </div>
            ) : iframeSrc && !viewerFailed ? (
              <iframe
                src={iframeSrc}
                title={title}
                scrolling="no"
                className="absolute inset-0 box-border h-full w-full overflow-hidden border-none object-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                onError={() => setViewerFailed(true)}
              />
            ) : (
              <div className="absolute inset-0 flex w-full flex-col items-center justify-center gap-3 p-4">
                {loadingRemote || (isOpen && effectiveKind === 'pdf' && !iframeSrc && !loadError) ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-primary" />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isArabic
                      ? 'تعذر عرض الملف هنا.'
                      : 'Could not preview this file.'}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
            <p
              className="text-center text-base font-bold leading-snug sm:text-lg"
              style={{ color: navy }}
              aria-hidden="true"
            >
              {title}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              {onDelete ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={deletePending}
                  className="h-11 flex-1 gap-2 rounded-lg border-2 bg-white font-semibold sm:max-w-xs"
                  style={{ borderColor: navy, color: navy }}
                  onClick={() => requestDelete()}
                >
                  <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                  {isArabic ? 'حذف' : 'Delete'}
                </Button>
              ) : null}
              <Button
                type="button"
                disabled={downloading}
                className={cn(
                  'h-11 gap-2 rounded-lg border-0 font-semibold text-white sm:max-w-xs',
                  onDelete ? 'flex-1' : 'w-full sm:w-auto sm:min-w-[200px]'
                )}
                style={{ backgroundColor: slateBtn }}
                onClick={() => void runDownload()}
              >
                <Download className="h-4 w-4 shrink-0" aria-hidden />
                {downloading
                  ? isArabic
                    ? 'جارٍ التحميل...'
                    : 'Downloading...'
                  : isArabic
                    ? 'تحميل'
                    : 'Download'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent
          className="max-w-md border-slate-200 shadow-lg bg-card/80 backdrop-blur-3xl"
          showCloseButton
        >
          <DialogHeader className="space-y-2 text-center sm:text-center">
            <DialogTitle
              className="text-lg font-bold sm:text-xl"
              style={{ color: navy }}
            >
              {isArabic ? 'تأكيد حذف هذا الجدول' : 'Confirm Deleting this schedule'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {isArabic
                ? 'سيُزال الجدول نهائياً من القائمة.'
                : 'This schedule will be permanently removed.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-center sm:gap-3 ">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-lg border-2 font-semibold border-[#1B2065] text-[#1B2065]"
              
              onClick={() => setDeleteConfirmOpen(false)}
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="button"
              disabled={deletePending}
              className="h-11 flex-1 rounded-lg border-0 font-semibold text-white"
              style={{ backgroundColor: navy }}
              onClick={() => void confirmDelete()}
            >
              {isArabic ? 'تأكيد' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
