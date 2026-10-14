
import HeroCarousel from "./HeroCarousel";
import type { HeroBanner } from "@/types/hero.types";

interface Props {
  banners: HeroBanner[];
}

export default function Hero({ banners }: Props) {
  if (banners.length === 0) {
    return null;
  }

  return (
    <section
      className="
        relative
        h-[300px]
        w-full
        overflow-hidden
        sm:h-[400px]
        md:h-[600px]
      "
    >
      <HeroCarousel banners={banners} />
    </section>
  );
}
