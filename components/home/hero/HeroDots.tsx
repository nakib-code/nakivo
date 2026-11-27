"use client";

interface HeroDotsProps {
  count: number;
  current: number;
  onSelect: (index: number) => void;
}

export default function HeroDots({
  count,
  current,
  onSelect,
}: HeroDotsProps) {
  return (
    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2.5 sm:bottom-4 sm:gap-3">
      {Array.from({ length: count }).map((_, index) => {
        const active = current === index;

        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`
              transition-all
              duration-300
              rounded-full
              ${
                active
                  ? "h-2 w-6 bg-white sm:h-2.5 sm:w-8"
                  : "h-2 w-2 bg-white/40 hover:bg-white/70 sm:h-2.5 sm:w-2.5"
              }
            `}
          />
        );
      })}
    </div>
  );
}