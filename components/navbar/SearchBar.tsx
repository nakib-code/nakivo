"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

interface SearchBarProps {
  className?: string;
}

export default function SearchBar({
  className,
}: SearchBarProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");

  const handleSubmit = (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const keyword = search.trim();

    if (!keyword) return;

    router.push(
      `/products?search=${encodeURIComponent(keyword)}`
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative ${className}`}
    >
      <Input
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
        placeholder="Search products..."
        className="h-11 rounded-full border-slate-300 pr-12 focus-visible:ring-2 focus-visible:ring-black"
      />

      <button
        type="submit"
        className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition hover:bg-slate-800"
      >
        
      </button>
    </form>
  );
}