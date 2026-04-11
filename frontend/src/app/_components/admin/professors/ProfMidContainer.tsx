import MyDropzone from "../DropBox";
import { Upload, SquarePlus } from "lucide-react";
import {Button, buttonVariants} from "@/components/ui/button";

export default function MiddleContainer() {
    const handleDrop = (files: File[]) => {
      console.log("Uploaded:", files);
    };

    return (

    <div className="flex items-center gap-4 py-7 px-5  max-w-fit">
    <Button className="w-60 h-14 bg-[#51689A] hover:bg-[#74A7BD] text-white text-lg font-semibold py-2 px-4 border border-[#51689A] rounded-md ">
        Add Professor
    </Button>

    <MyDropzone 
      onDrop={handleDrop}
      className="group cursor-pointer flex items-center justify-center 
                 px-6 w-60 h-14 bg-[#D9D9D917] border-2 border-dashed border-gray-300 
                 rounded-md bg-white hover:border-[#1B2065] hover:bg-blue-50/30 
                 transition-all duration-300"
    >
      <div className="flex flex-row items-center gap-2">
            <SquarePlus size={24} className="text-gray-300 group-hover:text-[#1B2065F2]" />
         <p className="text-lg font-medium text-slate-600">
           Drop file
         </p>
      </div>
    </MyDropzone>
    </div>

    );
}