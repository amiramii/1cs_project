'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {Trash2} from "lucide-react";

type PdfPreviewProps = {
  url: string;
  title?: string;
  date?: string;
  professor?: string;
  width?: number;  // new
  height?: number; // new
};

export default function PdfPreview({ 
  url, 
  title = 'Schedule Title', 
  date = '01/01/2026', 
  professor = 'Prof Moh',
  width = 192,  // default keeps existing behavior (w-48)
  height = 160, // default keeps existing behavior (h-40)
}: PdfPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const renderThumbnail = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        const pdf = await pdfjsLib.getDocument(url).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const scale = width / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
        if (!cancelled) setThumbnail(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('PDF thumbnail error:', err);
      }
    };
    renderThumbnail();
    return () => { cancelled = true; };
  }, [url, width]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const modal = isOpen ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 'min(860px, 92vw)', height: '90vh' }}
      >
        {/* Confirmation overlay */}
        {confirmDelete && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl">
            <div className="bg-white rounded-xl shadow-xl px-8 py-6 flex flex-col items-center gap-8 max-w-xs w-full mx-4">
              <Trash2 size={32} className="text-[#1B2065F2]" />
              <p className="text-md font-bold text-[#1B2065F2] text-center">Confirm deleting this schedule?</p>
              <div className="flex gap-8 w-full">
                <button
                  onClick={() => {
                    setConfirmDelete(false);
                    setIsOpen(false);
                    // call your onDelete prop here
                  }}
                  className="flex-1 px-4 py-2 text-sm rounded-lg bg-[#1B2065F2] text-white hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 px-4 py-2 text-sm rounded-lg bg-[#1B2065F2] text-white hover:bg-gray-50 hover:border hover:border-[#1B2065F2] hover:text-[#1B2065F2] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    
        {/* Header */}
        <div className="flex items-center justify-end px-5 py-3 border-b border-gray-100 bg-white">
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>
    
        <div className="flex-1 bg-gray-100">
          <iframe src={`${url}#toolbar=1`} width="100%" height="100%" className="border-none" />
        </div>
    
        {/* Footer */}
        <div className="relative flex items-center px-5 py-3 border-t border-gray-100 bg-white">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xl font-semibold text-[#1B2065F2]">{title} - {professor}</span>
          </div>
          <div>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1 bg-[#51689A] border border-[#1B2065F2] text-white shadow-sm rounded-md px-3 py-1.5"
            >
              <Trash2 size={16} />
              <span className="text-sm">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>   
  ) : null;

  return (
    <>
      {/* Preview Card */}
      <div
        onClick={() => setIsOpen(true)}
        className="cursor-pointer flex flex-col group transition-transform hover:scale-[1.02]"
        style={{ width }}
      >
        <div
          className="w-full bg-gray-100 overflow-hidden flex items-start justify-center border-t border-l border-r border-[#1B2065F2] rounded-t-md"
          style={{ height }}
        >
          {thumbnail ? (
            <img src={thumbnail} alt="PDF preview" className="w-full h-full object-cover object-top" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-[#1B2065F2] rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-0 w-full">
          <div className="flex bg-white text-[#1B2065F2] w-full">
            <div className="w-1/2 border border-[#1B2065F2] px-2 py-1 flex items-center justify-center text-[10px] font-bold text-center">{date}</div>
            <div className="w-1/2 border-t border-r border-b border-[#1B2065F2] px-2 py-1 flex items-center justify-center text-[10px] font-bold text-center leading-tight">{professor}</div>
          </div>
          <div className="w-full bg-[#1B2065F2] border border-[#1B2065F2] rounded-b-lg px-2 py-1.5 text-white flex items-center justify-center text-xs font-medium text-center">{title}</div>
        </div>
      </div>

      {/* Modal rendered at document.body — escapes any transform context */}
      {typeof window !== 'undefined' && createPortal(modal, document.body)}
    </>
  );
}