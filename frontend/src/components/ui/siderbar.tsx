"use client"

import * as React from "react"
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, GraduationCap, CalendarDays, MoveRight} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  /** Route groups `(routes)/(Dashboard)/(admin)` do not appear in the URL. */
  const menuItems = [
    { name: "Dashboard", href: "/Dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Professors", href: "/Professors", icon: <Users size={20} /> },
    { name: "Students", href: "/Students", icon: <GraduationCap size={20} /> },
    { name: "Schedules", href: "/Scheduals", icon: <CalendarDays size={20} /> },
  ];

  return (
    <aside className="w-60 h-screen sticky top-0 bg-[#FEF9F9] border-r-4 border-[#1B2065] flex flex-col p-4 shadow-sm rounded-2xl">
        <Image 
        src="/logo_dark.svg" 
        alt="Logo"
        width={200}
        height={50}
        priority
      />  
      {/* Sidebar Navigation */}
      <nav className="flex flex-col gap-2 mt-8">
        {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 text-[#1B2065F2] hover:bg-[#FEF9F9] hover:text-blue-600 rounded-xl transition-all duration-200 font-medium
                ${isActive
                    ? "bg-[#1B2065F2] text-[#FEF9F9] shadow-sm"
                    : "text-[#1B2065F2] hover:bg-gray-50"
                }`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        );
        })}
      </nav>

      {/* Optional: Bottom section for Sign Out */}
      <div className="mt-auto border-t border-gray-100 pt-4">
        <Link 
          href="/Login" 
          className="flex items-center gap-3 px-4 py-3 text-[#1B2065F2] hover:bg-red-50 rounded-xl transition-all"
        >
          <span>Logout</span>
          <MoveRight size={20}/>
          
        </Link>
        
      </div>
    </aside>
  );
}