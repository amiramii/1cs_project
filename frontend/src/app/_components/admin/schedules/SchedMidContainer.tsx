import MyDropzone from "../DropBox";
import { Upload, SquarePlus , GraduationCap , UserRoundPen , ChevronDown , CalendarCheck} from "lucide-react";
import {Button, buttonVariants} from "@/components/ui/button";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/tokenStorage";

export default function SchedulsMiddleContainer() {
  const [selectedValue, setSelectedValue] = useState("default");
  const [activeTab, setActiveTab] = useState("professor");
  const [year, setYear] = useState("default");
  const [title, setTitle] = useState("");
  const [professorName, setProfessorName] = useState("");
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const router = useRouter();
  const ProfessorSchedulesPath = () => {
    router.push("/Scheduals/Professor-Schedules"); 
  };
  const StudentSchedulesPath = () => {
    router.push("/Scheduals/Student-Schedules"); 
  };
  const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
  const handleDrop = useCallback((acceptedFiles: File[]) => {
  console.log("Files received:", acceptedFiles);
  if (acceptedFiles.length > 0) {
    setDroppedFile(acceptedFiles[0]);
    console.log("File set:", acceptedFiles[0].name); // verify in console
  }
}, []);
const handleUpload = async () => {
  if (!droppedFile || !title) return;

  setIsUploading(true);
  try {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("pdf", droppedFile);
    formData.append("audience", activeTab);

    const token = getAccessToken(); 
    const res = await fetch("http://127.0.0.1:8000/api/documents/", {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }), 
      },
      body: formData,
    });

    if (res.ok) {
      console.log("Schedule uploaded successfully");
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 1000);
    } else {
      const error = await res.json();
      console.error("Upload failed:", error);
    }
  } catch (err) {
    console.error("Error uploading:", err);
  } finally {
    setIsUploading(false);
  }
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
           
            { label: "Student", value: "student", icon: <GraduationCap size={18} /> },
            { label: "Professor", value: "teacher", icon: <UserRoundPen size={18} /> },
          ].map((option) => (
            <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name="audiance"
              value={option.value}
              className="peer hidden"
              checked={activeTab === option.value} 
              onChange={() => setActiveTab(option.value)}
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
            {year === "default" && 
              <ChevronDown
                className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#1B2065F2]"
                size={18}
              />
            }
    
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={activeTab === "professor"}
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
            disabled={activeTab === "student"}
          />
        </div>
        {/* ROW 4 - Shedule Title */}
        <input
          type="text"
          placeholder="Schedule Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-60 h-9 bg-white text-black py-2 px-4 border border-[#1B2065] rounded-md text-left shadow-md"
        />
        {/* ROW 5 -  Dropzone */}
        <div className="">
          <MyDropzone
            onDrop={handleDrop}
            accept={{ "application/pdf": [".pdf"] }}
            className="group cursor-pointer flex items-center justify-center 
                       px-6 w-[40vw] h-[18vh] bg-[#D9D9D917] border-2 border-dashed border-gray-300 
                       rounded-xl bg-white hover:border-[#1B2065] hover:bg-blue-50/30 
                       transition-all duration-300"
          >
            <div className="flex flex-row items-center gap-2">
              <SquarePlus size={24} className="text-gray-300 group-hover:text-[#1B2065F2]" />
              <p className="text-sm font-medium text-slate-600">
                {droppedFile ? droppedFile.name : "Drop file"}
              </p>
            </div>
          </MyDropzone>
        </div>
        {/* ROW 6 - Upload File button */}
        <button 
        onClick={handleUpload}
        disabled={isUploading || !droppedFile || !title}
        className="flex justify-center items-center gap-2 px-5 py-2 rounded-md h-9 w-[32vw] border border-[#1B2065F2] bg-[#1B2065F2] text-white font-semibold hover:bg-[#51689A] transition-all">
          <Upload size={18} className="text-white"/>
          {isUploading ? "Uploading..." : "Upload Schedule"}
        </button>
        {successMsg && (
          <p className="text-green-600 text-sm">Schedule uploaded successfully!</p>
        )}
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