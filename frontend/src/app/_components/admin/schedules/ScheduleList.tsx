"use client"
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import React , {useState} from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Funnel , Users } from "lucide-react";
import SearchBar from "./SearchBar";


function ScheduleList() {
        const [search, setSearch] = useState("");

  // Example data for demonstration
        const schedules = ["Meeting with Ahmed", "Lunch with Sara", "Call ghada", "Review Lina"];
        const filteredSchedules = schedules.filter(item =>
        item.toLowerCase().includes(search.toLowerCase())
    );
    return (
        <div className='bg-[#F6F7FE] border-y border-[#51689A] h-[calc(24vh-82px)] -mx-4 mt-[2vh] flex flex-row justify-between overflow-hidden '>

            <div className='flex flex-row p-8 items-center gap-4'>
                <Users className="text-[#1B2065F2]"/>
                <p className="text-[#1B2065F2] font-bold">
                    Schedule List
                </p>
            </div>
            <div className="flex justify-end items-center gap-4 py-7 px-5">
                <SearchBar value={search} onChange={setSearch} placeholder="Search schedules..." />
                <div className="relative flex items-center">
                    <select className="h-10 pl-8 pr-1 bg-[#74A7BD] text-[#FEF9F9] font-bold border border-[#1B2065F2] rounded-xl cursor-pointer appearance-none [&::-ms-expand]:hidden">
                        <option value="">Filter</option>
                        <option value="option1">Option 1</option>
                        <option value="option2">Option 2</option>
                    </select>
                    <Funnel className="absolute left-2 pointer-events-none text-[#FEF9F9]" size={16} />
                </div>
                <Button className="w-[100px] h-10 shrink-0 bg-[#FFFFFF] hover:bg-[#1B2065] text-[#1B2065F2] py-2 px-4 border border-[#1B2065F2] rounded-xl ">
                    Remove
                </Button>
            </div>
        </div>
    );
}
export default ScheduleList;