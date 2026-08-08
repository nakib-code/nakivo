"use client";

import DesktopNav from "./DesktopNav";
import MobileDrawer from "./MobileDrawer";
import { useScrolled } from "@/hooks/useScrolled";

export default function Navbar() {
  const scrolled = useScrolled();

  return (
    <header
      className={`
        sticky top-0 z-50
        w-full
        transition-all duration-300
        ${
          scrolled
            ? "border-b border-slate-200 bg-white/80 shadow-lg backdrop-blur-xl"
            : "border-b border-transparent bg-white"
        }
      `}
    >
      <div
        className={`
          mx-auto
          w-full
          max-w-[1600px]
          px-4
          sm:px-6
          lg:px-8
          xl:px-10
          2xl:px-12
          transition-all duration-300
          ${
            scrolled
              ? "h-16"
              : "h-20"
          }
        `}
      >
        {/* Desktop Navigation */}
        <div className="hidden h-full items-center lg:flex">
          <DesktopNav />
        </div>

        {/* Mobile Navigation */}
        <div className="flex h-full items-center lg:hidden">
          <MobileDrawer />
        </div>
      </div>
    </header>
  );
}
