"use client";

import React from 'react';
import { ArrowLeft } from "lucide-react";
import JustificationCard from "./JustificationCard";
export default function JustificationDetails() {
    return (
        <div className=" space-y-8 gap-4">
            <div className=" space-y-4">
              <h1 className="text-2xl font-semibold text-[#1B2065F2]">Students</h1>
              <p className="text-lg text-[#51689AF2]">check student justifications , refuse or accept them</p>
            </div>
            <div className="flex flex-row items-center gap-12">
                <ArrowLeft className="text-[#1B2065F2] cursor-pointer" size={36} />
                <h1 className="text-3xl font-semibold text-[#1B2065F2]">Bensaber Mohammed</h1>
                <div className="flex flex-row gap-6 text-sm text-[#51689AF2]">
                    <p>2CS</p>
                    <p>-</p>
                    <p>G2</p>
                    <p>-</p>
                    <p>m.bensaber@esi-sba.dz</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-12 p-4">
                <JustificationCard 
                index={1}
                startDate="01/02/2026"
                endDate="04/02/2026"
                cause="Illness (Cold)"
                pdfPath="/test.pdf"
                />
                <JustificationCard
                  index={2}
                  startDate="10/03/2026"
                  endDate="11/03/2026"
                  cause="Family emergency"
                  pdfPath="/test.pdf"
                />
            </div>
        </div>

    );
}