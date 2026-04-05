'use client';

import React, { useState } from 'react';

// Define the structure for your database files
type DbFile = {
  id: string;
  url: string;
  title: string;
};

export default function PdfView() {
  // 1. Initial State: Starting with your public/test.pdf
  // In a real app, 'dbFiles' would come from a standard fetch/props
  const [dbFiles] = useState<DbFile[]>([
    { id: 'initial', url: '/test.pdf', title: 'Default Document' },
    { id: '1', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', title: 'DB File 1' },
    { id: '2', url: 'https://pdfobject.com/pdf/sample.pdf', title: 'DB File 2' },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Navigation Logic
  const goToNext = () => {
    if (currentIndex < dbFiles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const currentFile = dbFiles[currentIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {/* Navigation Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '10px',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <button 
          onClick={goToPrevious} 
          disabled={currentIndex === 0}
          style={{ padding: '8px 16px', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
        >
          ← Previous
        </button>

        <span style={{ fontWeight: 'bold' }}>
          {currentFile.title} ({currentIndex + 1} of {dbFiles.length})
        </span>

        <button 
          onClick={goToNext} 
          disabled={currentIndex === dbFiles.length - 1}
          style={{ padding: '8px 16px', cursor: currentIndex === dbFiles.length - 1 ? 'not-allowed' : 'pointer' }}
        >
          Next →
        </button>
      </div>

      {/* Viewer Window */}
      <div style={{ height: '75vh', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
        <iframe
          key={currentFile.url} // Key forces iframe to reload when URL changes
          src={`${currentFile.url}#toolbar=0`}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
}