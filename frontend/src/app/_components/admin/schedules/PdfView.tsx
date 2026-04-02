'use client';

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Set PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface FullPdfViewerProps {
  fileUrl?: string; // URL of the PDF
}

const FullPdfViewer: React.FC<FullPdfViewerProps> = ({
  fileUrl = 'https://algeriainvest.com/storage/uploads/discover_algeria/documents/1627339255Law%20and%20legal%20system.pdf', // example URL
}) => {
  const [numPages, setNumPages] = useState<number>(0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="flex justify-end w-full">
    <div className="w-[80%] h-screen overflow-y-auto bg-[#f0f0f0] p-4 mt-8 mr-3">
      <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
        {Array.from(new Array(numPages), (_, index) => (
          <Page
            key={`page_${index + 1}`}
            pageNumber={index + 1}
            width={800} // adjust as needed
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        ))}
      </Document>
    </div>
    </div>
  );
};

export default FullPdfViewer;