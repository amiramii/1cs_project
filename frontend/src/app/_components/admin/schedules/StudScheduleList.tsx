"use client"
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import React , {useEffect, useState} from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Funnel , Users , MoveRight , MoveLeft } from "lucide-react";
import SearchBar from "../SearchBar";
import { useRouter } from 'next/navigation';
import { getAccessToken } from "@/lib/tokenStorage";
import PdfGrid from "./PdfGrid";

type Schedule = {
  id: number;
  title: string;
  pdf: string;
  audience: "student" | "professor";
  uploaded_at: string;
};

function ScheduleList() {
    const [search, setSearch] = useState("");
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(false);

     useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      try {
        const token = getAccessToken();
        const res = await fetch(
          `http://127.0.0.1:8000/api/documents/?search=${encodeURIComponent(search)}&audience=student`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSchedules(data.results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchSchedules, 300); // wait 300ms after typing stops
    return () => clearTimeout(debounce);
    }, [search]);
    const router = useRouter();
    const ProfessorSchedulesPath = () => {
      router.push("/Scheduals/Professor-Schedules"); 
    };
    const SchedulesPath = () => {
      router.push("/Scheduals"); 
    };
    return (
        <div>
            <div className='flex flex-row justify-center gap-60 text-2xl font-bold text-[#1B2065F2] mt-[2vh] mb-[4vh]'>
                   <button 
                    onClick={ProfessorSchedulesPath} 
                    className="hover:scale-110 transition-transform cursor-pointer"
                    aria-label="Go back"
                >
                    <MoveLeft size={36} />
                </button>
                <h1>Student Schedules</h1>
                <button 
                    onClick={SchedulesPath} 
                    className="hover:scale-110 transition-transform cursor-pointer"
                    aria-label="Student Schedules"
                >
                    <MoveRight size={36} />
                </button>
            </div>
            <div className='bg-[#F6F7FE] border border-[#51689A] rounded-lg h-[calc(24vh-82px)] mt-[2vh] flex flex-row justify-between overflow-hidden shadow-md mb-[4vh]'>
    
                <div className='flex flex-row p-8 items-center gap-4'>
                    <Users className="text-[#1B2065F2] border border-[#1B2065F2] rounded-md"/>
                    <p className="text-[#1B2065F2] font-bold ">
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
                </div>
            </div>
        
            {loading && <p className="text-center text-[#1B2065]">Searching...</p>}
            <PdfGrid schedules={schedules} />
        </div>
    );
}
export default ScheduleList;