import MyDropzone from "../DropBox";
import { Upload, SquarePlus } from "lucide-react";
import {Button, buttonVariants} from "@/components/ui/button";

export default function SchedulsMiddleContainer() {
    const handleDrop = (files: File[]) => {
      console.log("Uploaded:", files);
    };

    return (
    <div className="flex flex-col justify-center items-end h-[calc(32vh-64px)] p-8">
    <div className="flex items-center gap-4 py-7 px-5 border border-[#1B2065] rounded-xl bg-[#FEF9F9] shadow-sm max-w-fit">
      
      <select className="w-60 h-14 bg-[#1B2065] hover:bg-[#1B2065] text-white font-bold py-2 px-4 border border-[#1B2065] rounded-xl">
        <option value="" disabled hidden className="bg-[#1B2065]">Type</option>
        <option value="regular" className="bg-[#FEF9F9] text-black">Regular</option>
        <option value="exams" className="bg-[#FEF9F9] text-black">Exams</option>
        <option value="replacement" className="bg-[#FEF9F9] text-black">Replacement exams</option>
        <option value="ramadan" className="bg-[#FEF9F9] text-black">Ramadan</option>
        <option value="other" className="bg-[#FEF9F9] text-black">Other</option>
      </select>
      <select className="w-60 h-14 bg-[#1B2065] hover:bg-[#1B2065] text-white font-bold py-2 px-4 border border-[#1B2065] rounded-xl">
        <option value="" disabled hidden className="bg-[#1B2065]">Dedicated For :</option>
        <option value="professors" className="bg-[#FEF9F9] text-black">Professors</option>
        <option value="students" className="bg-[#FEF9F9] text-black">Students</option>
      </select>
      <MyDropzone 
        onDrop={handleDrop}
        className="group cursor-pointer flex items-center justify-center 
                   px-6 w-60 h-14 bg-[#D9D9D917] border-2 border-dashed border-gray-300 
                   rounded-xl bg-white hover:border-[#1B2065] hover:bg-blue-50/30 
                   transition-all duration-300"
      >
        <div className="flex flex-row items-center gap-2">
              <SquarePlus size={24} className="text-gray-300 group-hover:text-[#1B2065F2]" />
           <p className="text-sm font-medium text-slate-600">
             Drop file
           </p>
        </div>
      </MyDropzone>
    </div>
    </div>
    );
}