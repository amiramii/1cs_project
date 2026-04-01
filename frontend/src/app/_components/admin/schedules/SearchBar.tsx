"use client";
import React from "react";
import { Search } from "lucide-react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search..."
}: SearchBarProps) {
  return (
    <div className="relative w-full max-w-xs">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-3 rounded-xl border border-[#1B2065F2] bg-white text-[#1B2065F2] font-medium focus:outline-none focus:ring-2 focus:ring-[#1B2065]"
      />  
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        size={18}
      />
    </div>
  );
}