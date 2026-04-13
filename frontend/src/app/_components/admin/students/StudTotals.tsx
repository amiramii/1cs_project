"use client";

import TotalStaff from "../TotalStaff";
import {Users , MailWarning, CircleCheckBig}   from "lucide-react";

export default function ProfTotals() {
    return (
        <div className="flex flex-row gap-8 justify-center">
        <TotalStaff label="Total Students" icon={<Users />} count={1900} details={"Active"}/>
        <TotalStaff label="Unjustified Absences" icon={<MailWarning />} count={50} details={"Available"}/>
        <TotalStaff label="Justified Absence Rate" icon={<CircleCheckBig />} count="15%" details={"Low"}/>
        </div>
    );
}