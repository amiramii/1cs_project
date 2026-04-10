import Image from "next/image";
import Sidebar from "../../../components/ui/siderbar";
import { User } from "lucide-react";
import { Sun } from "lucide-react";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar/>
      <div className="flex-1 flex flex-col">
      <header className="w-full h-16 border-b border-[#1B2065] flex items-center justify-end px-8"
        style={{
          backgroundImage: "url('/bg2H.svg')", // path relative to public folder
          backgroundSize: "cover",       // makes image cover the header
          backgroundPosition: "top",  // centers the image
        }}>
        
        <div className="flex items-center gap-9 pr-4">
            <Sun className="text-[#1B2065F2] "/>
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300 ml-4"> 
              {/* If you have a user image, use <Image />, otherwise show the User icon */}
              <User className="text-gray-500" size={25} />
              
              {/* Once you have a real image, use this instead:
              <Image 
                src="/path-to-your-photo.jpg" 
                alt="User" 
                width={40} 
                height={40} 
                className="object-cover"
              /> 
              */}
            </div>
        </div>
      </header>
      <main className="flex-1 p-4 lt-2">
        {children} 
      </main>
      </div>
    </div>
  );
}