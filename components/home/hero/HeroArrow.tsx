"use client";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
      aria-label={
        direction === "left"
          ? "Previous slide"
          : "Next slide"
      }
      className={`
        absolute
        top-1/2
        z-20
        flex
        h-8
        w-8
        -translate-y-1/2
        items-center
        justify-center
        rounded-full
        border
        border-white/20
        bg-white/10
        p-0
        text-white
        backdrop-blur-md
        transition-all
        duration-300
        hover:scale-110
        hover:bg-white
        hover:text-black

        sm:h-10
        sm:w-10

        md:h-11
        md:w-11

        ${
          direction === "left"
            ? "left-2 sm:left-4 md:left-5"
            : "right-2 sm:right-4 md:right-5"
        }
      `}
    >
      {direction === "left" ? (
        <ChevronLeft
          className="
            h-4
            w-4
            sm:h-5
            sm:w-5
            md:h-6
            md:w-6
          "
        />
      ) : (
        <ChevronRight
          className="
            h-4
            w-4
            sm:h-5
            sm:w-5
            md:h-6
            md:w-6
          "
        />
      )}
    </button>
  );
}