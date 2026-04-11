"use client";
import Link from 'next/link'; 

interface NavItemProps {
  label: string;  // The text to display
//   route: string;  // The URL path
  icon?: React.ReactNode;
  count?: number | string;
  details: string;
}

export default function TotalStaff({ label, icon, count, details}: NavItemProps) {
  return (
    <div className="flex flex-col items-left bg-[#FEF9F9] border border-[#51689A] rounded-md max-w-fit p-3">
      <div className="flex flex-row items-center justify-center gap-24 h-full">
        <p className="text-[#51689A]">{label}</p>
        {icon && <span className="mr-2 text-[#1B2065F2]">{icon}</span>}
      </div>
      <p className="text-[#1B2065F2] font-semibold text-2xl px-2">{count}</p>
      <div>
        <p className="text-[#74A7BD] text-xs px-2 pt-2">{details}</p>
      </div>
    </div>
  );
}
    // <Link href={route} className="flex items-center p-3 hover:bg-gray-100 rounded-lg transition-colors">
    //   {icon && <span className="mr-2">{icon}</span>}
    //   <span className="font-medium text-gray-700">{label}</span>
    // </Link>
// 'use client';

// import React, { useState, useEffect } from 'react';

// interface PDFFile {
//   url: string;
//   name: string;
// }

// interface TotalStaffProps {
//   label: string;
//   icon?: React.ReactNode;
//   backendUrl: string; // The link to your API
// }

// export default function TotalStaff({ label, icon, backendUrl }: TotalStaffProps) {
//   const [files, setFiles] = useState<PDFFile[]>([]);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [loading, setLoading] = useState(true);

//   // 1. Fetch the PDF list from the backend
//   useEffect(() => {
//     async function fetchData() {
//       try {
//         const response = await fetch(backendUrl);
//         const data = await response.json();
//         // Assuming backend returns an array: [{ name: "File 1", url: "..." }, ...]
//         setFiles(data);
//         setLoading(false);
//       } catch (error) {
//         console.error("Error fetching PDFs:", error);
//         setLoading(false);
//       }
//     }
//     fetchData();
//   }, [backendUrl]);

//   // 2. Navigation Logic
//   const nextFile = () => {
//     if (currentIndex < files.length - 1) setCurrentIndex(currentIndex + 1);
//   };

//   const prevFile = () => {
//     if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
//   };

//   return (
//     <div className="bg-[#F6F7FEF2] border border-[#1B2065F2] rounded-2xl p-4 w-full max-w-2xl shadow-sm">
//       <div className="flex items-center justify-between mb-4">
//         <div className="flex items-center gap-2">
//           {icon && <span className="text-[#1B2065F2]">{icon}</span>}
//           <p className="text-[#1B2065F2] font-bold text-lg">{label}</p>
//         </div>
        
//         {/* Navigation Buttons */}
//         {!loading && files.length > 0 && (
//           <div className="flex gap-2">
//             <button 
//               onClick={prevFile} 
//               disabled={currentIndex === 0}
//               className="px-3 py-1 bg-white border border-[#1B2065F2] rounded-md disabled:opacity-30"
//             >
//               Back
//             </button>
//             <button 
//               onClick={nextFile} 
//               disabled={currentIndex === files.length - 1}
//               className="px-3 py-1 bg-[#1B2065F2] text-white rounded-md disabled:opacity-30"
//             >
//               Next
//             </button>
//           </div>
//         )}
//       </div>

//       {/* 3. The PDF Display Area */}
//       <div className="bg-white rounded-xl border border-gray-200 h-[500px] overflow-hidden flex items-center justify-center">
//         {loading ? (
//           <p className="text-gray-400 animate-pulse">Loading documents...</p>
//         ) : files.length > 0 ? (
//           <iframe
//             key={files[currentIndex].url}
//             src={`${files[currentIndex].url}#toolbar=0`}
//             className="w-full h-full border-none"
//           />
//         ) : (
//           <p className="text-gray-400">No documents found.</p>
//         )}
//       </div>

//       {/* File info footer */}
//       {!loading && files.length > 0 && (
//         <p className="mt-2 text-xs text-[#1B2065F2] text-center">
//           Viewing: {files[currentIndex].name} ({currentIndex + 1} of {files.length})
//         </p>
//       )}
//     </div>
//   );
// }