import MyDropzone from "../DropBox";
import { Upload, SquarePlus } from "lucide-react";
import {Button, buttonVariants} from "@/components/ui/button";
import SearchBar from "./SearchBar";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SchedulsMiddleContainer() {
    const handleDrop = (files: File[]) => {
      console.log("Uploaded:", files);
    };

    const router = useRouter();
    const ProfessorSchedulesPath = () => {
      router.push("/Scheduals/Professor-Schedules"); 
    };
    const StudentSchedulesPath = () => {
      router.push("/Scheduals/Student-Schedules"); 
    };

    return (
    <div className="flex flex-col gap-20 items-center justify-center">

      <div className="flex flex-col items-center gap-4 py-7 px-5 border border-[#1B2065] rounded-xl bg-[#FEF9F9] shadow-[0px_4px_8px_rgba(0,0,0,0.4)] max-w-fit">
        <div className="grid grid-rows-3 place-items-center gap-6">
  
          {/* ROW 1 - Title centered */}
          <h1 className="text-[#1B2065F2] font-semibold text-3xl">Add Schedule</h1>
        
          {/* ROW 2 - Select + Input */}
          <div className="grid grid-cols-2 w-full place-items-center items-end">
            <select 
              className="w-60 h-11 bg-[#51689A] text-white font-bold py-2 px-4 border border-[#1B2065] rounded-xl text-center shadow-[4px_4px_10px_rgba(0,0,0,0.4)]"
              defaultValue="default"
            >
              <option value="default" disabled hidden>Choose Audience</option>
              <option value="Professors" className="bg-white text-black">Professors</option>
              <option value="Students" className="bg-white text-black">Students</option>
            </select>
            <input name="SchedTitle" placeholder="Schedule Title..." className="w-72 border rounded-xl shadow-[4px_4px_10px_rgba(0,0,0,0.4)]"/>
          </div>
        
          {/* ROW 3 - Button + Dropzone */}
          <div className="grid grid-cols-2 w-full place-items-center items-center">
            <Button className="w-20 bg-[#1B2065F2] rounded-xl text-white font-bold border border-[#1B2065] shadow-[4px_4px_10px_rgba(0,0,0,0.4)]">
              Save
            </Button>
            <MyDropzone
              onDrop={handleDrop}
              className="group cursor-pointer flex items-center justify-center 
                         px-6 w-48 h-14 bg-[#D9D9D917] border-2 border-dashed border-gray-300 
                         rounded-xl bg-white hover:border-[#1B2065] hover:bg-blue-50/30 
                         transition-all duration-300"
            >
              <div className="flex flex-row items-center gap-2">
                <SquarePlus size={24} className="text-gray-300 group-hover:text-[#1B2065F2]" />
                <p className="text-sm font-medium text-slate-600">Drop file</p>
              </div>
            </MyDropzone>
          </div>
  
        </div>
      </div>
      <div className="flex flex-row items-center gap-40">
        <Button
          onClick={ProfessorSchedulesPath}
          className="h-30 w-48 bg-[#1B2065F2] border rounded-xl text-white font-semibold p-12 shadow-md"
        >
          Professors <br/>
          Schedule
        </Button>
        <Button
          onClick={StudentSchedulesPath}
          className="h-30 w-48 bg-[#1B2065F2] border rounded-xl text-white font-semibold p-12 shadow-md"
        >
          Students <br/>
          Schedule
        </Button>
      </div>
    </div>
    );
}