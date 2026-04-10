"use client"
import React, { useState } from 'react';
import PdfPreview from './PdfPreview';

// export default function PdfGrid({ pdfs }: { pdfs: { url: string; title: string; date: string; professor: string }[] }) {}

export default function PdfGrid() {
    return (
        <div className="grid grid-cols-3 gap-6 w-full mb-[4vh] max-w-5xl mx-auto px-6">
            {[
                { url: "/test.pdf", title: "Test Schedule" },
                { url: "/emploi.pdf", title: "Sample Schedule" },

            ].map((item, i) => (
                <div key={i} className="w-full flex items-center justify-center">
                    <div className="w-full" style={{ containerType: 'inline-size' }}>
                        <div
                            style={{
                                width: '192px', // w-48 = 192px (PdfPreview's hardcoded width)
                                transform: 'scale(var(--scale))',
                                transformOrigin: 'top left',
                            }}
                            ref={(el) => {
                                if (!el) return;
                                const parent = el.parentElement!;
                                const scale = parent.offsetWidth / 192;
                                el.style.setProperty('--scale', String(scale));
                                parent.style.height = `${el.offsetHeight * scale}px`;
                            }}
                        >
                            <PdfPreview
                                url={item.url}
                                title={item.title}
                                date="01/01/2026"
                                professor="Prof Moh"
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}