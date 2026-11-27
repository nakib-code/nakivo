
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
    <section className="relative w-full overflow-hidden">
      <HeroCarousel banners={banners} />
    </section>
  );
}
