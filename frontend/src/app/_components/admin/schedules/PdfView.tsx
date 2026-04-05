'use client';

import React, { useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

// --- Types ---
import type { PDFDataRangeTransport } from 'pdfjs-dist';
import type { TypedArray } from 'pdfjs-dist/types/src/display/api.js';

type BinaryData = TypedArray | ArrayBuffer | number[] | string;
export type Source = { data: BinaryData | undefined } | { range: PDFDataRangeTransport } | { url: string };
export type FileSource = string | ArrayBuffer | Blob | Source | null;

export default function PdfView() {
  const [file, setFile] = useState<FileSource>(null);
  const [render, setRender] = useState(true);

  // Input Refs
  const urlRef = useRef<HTMLInputElement>(null);
  const fetchRef = useRef<HTMLInputElement>(null);
  
  const fileId = useId();
  const urlId = useId();
  const fetchId = useId();

  // Helper to convert File/Blob to a URL for the <iframe>
  const getFileUrl = () => {
    if (!file) return null;
    if (typeof file === 'string') return file;
    if (file instanceof Blob || file instanceof File) return URL.createObjectURL(file);
    return null;
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const onURLChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlRef.current) setFile(urlRef.current.value);
  };

  const onFetchChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (fetchRef.current) {
      fetch(fetchRef.current.value)
        .then(res => res.blob())
        .then(setFile);
    }
  };

  const resetComponent = () => {
    flushSync(() => setRender(false));
    flushSync(() => setRender(true));
  };

  if (!render) return null;

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '12px' }}>
      <fieldset style={{ marginBottom: '20px', border: '1px solid #eee' }}>
        <legend>Load PDF</legend>
        
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor={fileId}>Upload: </label>
          <input id={fileId} type="file" accept=".pdf" onChange={onFileChange} />
        </div>

        <form onSubmit={onURLChange} style={{ marginBottom: '10px' }}>
          <label htmlFor={urlId}>URL: </label>
          <input id={urlId} ref={urlRef} type="text" placeholder="https://..." />
          <button type="submit">Load</button>
        </form>

        <form onSubmit={onFetchChange}>
          <label htmlFor={fetchId}>Fetch: </label>
          <input id={fetchId} ref={fetchRef} type="text" placeholder="API path..." />
          <button type="submit">Fetch</button>
        </form>

        <div style={{ marginTop: '10px' }}>
          <button onClick={() => setFile(null)}>Unload</button>
          <button onClick={resetComponent} style={{ marginLeft: '10px' }}>Restart</button>
        </div>
      </fieldset>

      {/* Basic PDF Viewer (using browser native viewer) */}
      <div style={{ height: '600px', background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {file ? (
          <iframe
            src={getFileUrl() || ''}
            width="100%"
            height="100%"
            title="PDF Viewer"
            style={{ border: 'none' }}
          />
        ) : (
          <p>Select a file to preview it here</p>
        )}
      </div>
    </div>
  );
}