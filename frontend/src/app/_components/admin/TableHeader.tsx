"use client";

import {useState} from "react";
import { Funnel, Users } from "lucide-react";
import SearchBar from "./SearchBar";

export default function TableHeader() {
    const [search, setSearch] = useState("");
     return (
        <div>
            <div className='bg-[#F6F7FE] border border-[#51689A] rounded-lg h-[calc(24vh-82px)] mt-[2vh] flex flex-row justify-between overflow-hidden shadow-md  mb-[4vh]'>
    
                <div className='flex flex-row p-8 items-center gap-4'>
                    <Users className="text-[#1B2065F2] border border-[#1B2065F2] rounded-md"/>
                    <p className="text-[#1B2065F2] font-bold">
                        Schedule List
                    </p>
                </div>
                <div className="flex justify-end items-center gap-4 py-7 px-5">
                    <SearchBar value={search} onChange={setSearch} placeholder="Search schedules..." />
                    <div className="relative flex items-center">
                        <Funnel 
                        className="absolute left-3 pointer-events-none text-[#1B2065F2]" 
                        size={18} 
                         />
                        <select 
                          className="h-10 pl-8 pr-1 bg-[#FEF9F9] text-[#1B2065F2] border border-[#1B2065F2] rounded-xl"
                          defaultValue="default"
                        >
                          <option value="default" disabled hidden>Filter</option>
                          <option value="Professors" className="bg-white text-black">Professors</option>
                          <option value="Students" className="bg-white text-black">Students</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};