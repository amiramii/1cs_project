"use client";

import TotalStaff from "../TotalStaff";
import {Users , BookMarked , Activity}   from "lucide-react";

export default function ProfTotals() {
    return (
        <div className="flex flex-row gap-8 justify-center">
        <TotalStaff label="Total Professors" icon={<Users />} count={1900} details={"Active"}/>
        <TotalStaff label="Total Modules" icon={<BookMarked />} count={50} details={"Available"}/>
        <TotalStaff label="Average Absence" icon={<Activity />} count="15%" details={"Low"}/>
        </div>
    );
}

// import TotalStaff from '@/components/TotalStaff';
// import { UserIcon, FileTextIcon } from 'lucide-react'; // Example icons

// export default function Dashboard() {
//   return (
//     <div className="p-10 space-y-8">
//       {/* Example 1: Staff PDFs */}
//       <TotalStaff 
//         label="Staff Records" 
//         backendUrl="https://your-api.com/v1/staff-pdfs" 
//         icon={<UserIcon size={20} />}
//       />

//       {/* Example 2: Financial Reports */}
//       <TotalStaff 
//         label="Monthly Reports" 
//         backendUrl="https://your-api.com/v1/reports" 
//         icon={<FileTextIcon size={20} />}
//       />
//     </div>
//   );
// }