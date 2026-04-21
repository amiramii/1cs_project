'use client'

import dynamic from 'next/dynamic'
import type { PdfPreviewProps } from './PdfPreviewClient'

const PdfPreviewClient = dynamic(() => import('./PdfPreviewClient'), {
  ssr: false,
  loading: () => (
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="h-[168px] w-full shrink-0 animate-pulse bg-muted/70" />
      <div className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-white px-2 py-2">
        <div className="mx-auto h-3 w-16 rounded bg-muted/90" />
        <div className="mx-auto h-3 w-20 rounded bg-muted/90" />
      </div>
      <div className="h-9 w-full animate-pulse bg-muted" />
    </div>
  ),
})

export type { PdfPreviewProps }

export default function PdfPreview(props: PdfPreviewProps) {
  return <PdfPreviewClient {...props} />
}
