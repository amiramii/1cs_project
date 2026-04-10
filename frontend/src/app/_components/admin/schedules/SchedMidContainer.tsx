import MyDropzone from "../DropBox";
import { Upload, SquarePlus , GraduationCap , UserRoundPen , ChevronDown , CalendarCheck} from "lucide-react";
import {Button, buttonVariants} from "@/components/ui/button";
import SearchBar from "./SearchBar";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SchedulsMiddleContainer() {
  const [selectedValue, setSelectedValue] = useState("default");
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
    <div className="flex flex-col items-center gap-2 py-7 px-5 border border-[#1B2065] rounded-md bg-[#FEF9F9] shadow-[0px_4px_8px_rgba(0,0,0,0.4)] w-[50vw]">
      <div className="grid grid-rows-3 place-items-center gap-4">

        {/* ROW 1 - Title centered */}
        <h1 className="text-[#1B2065F2] font-semibold text-2xl">Add Schedule</h1>
      
        {/* ROW 2 - Student-Prof Radio buttons*/}
        <div className="flex flex-row gap-44">
          {[
            { label: "Professor", value: "professor", icon: <UserRoundPen size={18} /> },
            { label: "Student", value: "student", icon: <GraduationCap size={18} /> },
          ].map((option) => (
            <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name="audiance"
              value={option.value}
              className="peer hidden"
              defaultChecked={option.value === "Professor"}
            />
            {/* The Styled Button Container */}
            <div className="
              flex items-center justify-center gap-2 px-5 py-2 h-9 w-40 rounded-xl border border-[#1B2065F2] transition-all
              text-[#1B2065F2] font-semibold
              peer-checked:bg-[#51689A] peer-checked:text-white
              hover:bg-[#1B2065F2]/10
            ">

              {option.icon}
              <span>{option.label}</span>
            </div>
          </label>
          ))}
      </div>
        {/*ROW 3 - Year and Professor name*/}
        <div className="flex flex-row gap-20">
          <div className="relative w-60 h-10">
            {selectedValue === "default" && (
              <ChevronDown
                className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#1B2065F2]"
                size={18}
              />
            )}
    
            <select
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
              className="w-full h-full bg-white text-[#1B2065F2] py-2 px-4 border border-[#1B2065] rounded-md text-left shadow-md appearance-none cursor-pointer"
            >
              <option value="default" disabled hidden>Year</option>
              <option value="All" className="bg-white text-[#51689A]">All Years</option>
              <option value="1CS" className="bg-white text-[#51689A]">1CP</option>
              <option value="2CS" className="bg-white text-[#51689A]">2CP</option>
              <option value="1CS" className="bg-white text-[#51689A]">1CS</option>
              <option value="2CS" className="bg-white text-[#51689A]">2CS</option>
              <option value="1CS" className="bg-white text-[#51689A]">3CS</option>
              <option value="2CS" className="bg-white text-[#51689A]">Doctorats</option>
            </select>
          </div>
          <input 
            type="text" 
            placeholder="Professor Name..." 
            className="w-60 h-10 bg-white text-black py-2 px-4 border border-[#1B2065] rounded-md text-left shadow-md"
          />
        </div>
        {/* ROW 4 - Shedule Title */}
        <input
          type="text"
          placeholder="Schedule Title..."
          className="w-60 h-9 bg-white text-black py-2 px-4 border border-[#1B2065] rounded-md text-left shadow-md"
        />
        {/* ROW 5 -  Dropzone */}
        <div className="">
          <MyDropzone
            onDrop={handleDrop}
            className="group cursor-pointer flex items-center justify-center 
                       px-6 w-[40vw] h-[18vh] bg-[#D9D9D917] border-2 border-dashed border-gray-300 
                       rounded-xl bg-white hover:border-[#1B2065] hover:bg-blue-50/30 
                       transition-all duration-300"
          >
            <div className="flex flex-row items-center gap-2">
              <SquarePlus size={24} className="text-gray-300 group-hover:text-[#1B2065F2]" />
              <p className="text-sm font-medium text-slate-600">Drop file</p>
            </div>
          </MyDropzone>
        </div>
        {/* ROW 6 - Upload File button */}
        <button className="flex justify-center items-center gap-2 px-5 py-2 rounded-md h-9 w-[32vw] border border-[#1B2065F2] bg-[#1B2065F2] text-white font-semibold hover:bg-[#51689A] transition-all">
          <Upload size={18} className="text-white"/>
          Upload Schedule
        </button>
      </div>
    </div>
    <div className="flex flex-row items-center gap-40">
      <Button
        onClick={ProfessorSchedulesPath}
        className=" w-[24vw] bg-[#1B2065F2] border rounded-xl text-white font-semibold p-9 shadow-md"
      >
        <CalendarCheck className="text-white size-{28}"/>
        Professors
        Schedule
      </Button>
      <Button
        onClick={StudentSchedulesPath}
        className="w-[24vw] bg-[#1B2065F2] border rounded-xl text-white font-semibold p-9 shadow-md"
      >
        <CalendarCheck className="text-white"/>
        Students 
        Schedule
      </Button>
    </div>
  </div>
  );
}