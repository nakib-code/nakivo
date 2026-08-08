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
    <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-3">
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
                  ? "w-8 h-3 bg-white"
                  : "w-3 h-3 bg-white/40 hover:bg-white/70"
              }
            `}
          />
        );
      })}
    </div>
  );
}