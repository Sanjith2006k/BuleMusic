"use client";

import { Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <Search
        className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500"
        size={18}
      />

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search songs..."
        className="w-full rounded-full border border-white/10 bg-white/5 py-4 pl-14 pr-5 outline-none backdrop-blur-xl transition focus:border-[#0A84FF]"
      />
    </div>
  );
}
