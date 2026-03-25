import MyDropzone from "./DropBox";
import { Upload } from "lucide-react";
import {Button, buttonVariants} from "@/components/ui/button";

export default function MiddleContainer() {
    const handleDrop = (files: File[]) => {
      console.log("Uploaded:", files);
    };

    return (
    <div className="flex flex-col justify-center h-[calc(100vh-64px)] p-8">
    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-2xl bg-white shadow-sm max-w-fit">
    <Button className="bg-[#74A7BD] hover:bg-blue-700 text-white font-bold py-2 px-4 border border-[#1B2065] rounded">
        Add Professor
    </Button>

    <MyDropzone 
      onDrop={handleDrop}
      className="group cursor-pointer flex flex-col items-center justify-center 
                 w-full max-w-xl h-40 border-2 border-dashed border-gray-300 
                 rounded-[2rem] bg-white hover:border-[#1B2065] hover:bg-blue-50/30 
                 transition-all duration-300"
    >
      <div className="flex flex-col items-center gap-2">
         <div className="p-3 bg-gray-100 rounded-full group-hover:bg-[#1B2065] transition-colors">
            <Upload size={24} className="text-gray-500 group-hover:text-white" />
         </div>
         <p className="text-sm font-medium text-slate-600">
           Drop file
         </p>
      </div>
    </MyDropzone>
    </div>
    </div>
    );
}