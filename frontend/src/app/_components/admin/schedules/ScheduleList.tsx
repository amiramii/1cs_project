"use client"
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Funnel , Users } from "lucide-react";

function ScheduleList() {
    return (
        <div className='bg-[#F6F7FE] border-y border-[#51689A] h-[calc(24vh-82px)] -mx-4 mt-[2vh]'>
            <div className="flex justify-end items-center gap-4 py-7 px-5 h-full">
                <div className="relative flex items-center">
                    <select className="h-10 pl-8 pr-1 bg-[#74A7BD] text-[#FEF9F9] font-bold border border-[#1B2065F2] rounded-xl cursor-pointer appearance-none [&::-ms-expand]:hidden">
                        <option value="">Filter</option>
                        <option value="option1">Option 1</option>
                        <option value="option2">Option 2</option>
                    </select>
                    <Funnel className="absolute left-2 pointer-events-none text-[#FEF9F9]" size={16} />
                </div>
                <Button className="w-[100px] h-10 shrink-0 bg-[#FFFFFF] hover:bg-[#1B2065] text-[#1B2065F2] font-bold py-2 px-4 border border-[#1B2065F2] rounded-xl ">
                    Remove
                </Button>
            </div>
            <p>
                <Users/>
                Schedule List
            </p>
        </div>
    );
}
export default ScheduleList;