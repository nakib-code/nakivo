"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface HeroArrowProps {
  direction: "left" | "right";
  onClick: () => void;
}

export default function HeroArrow({
  direction,
  onClick,
}: HeroArrowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        absolute
        top-1/2
        z-20
        -translate-y-1/2
        rounded-full
        bg-white/10
        backdrop-blur-md
        border
        border-white/20
        p-3
        text-white
        transition-all
        duration-300
        hover:bg-white
        hover:text-black
        hover:scale-110
        ${direction === "left" ? "left-5" : "right-5"}
      `}
    >
      {direction === "left" ? (
        <ChevronLeft className="h-6 w-6" />
      ) : (
        <ChevronRight className="h-6 w-6" />
      )}
    </button>
  );
}