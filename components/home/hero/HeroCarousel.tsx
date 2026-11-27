"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { HeroBanner } from "@/types/hero.types";
import HeroDots from "./HeroDots";
import HeroArrow from "./HeroArrow";
import HeroSlide from "./HeroSlide";

interface Props {
  banners: HeroBanner[];
}

export default function HeroCarousel({ banners }: Props) {
  const plugins = useMemo(
    () =>
      banners.length > 1
        ? [
            Autoplay({
              delay: 5000,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
            }),
          ]
        : [],
    [banners.length]
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: banners.length > 1,
      align: "start",
    },
    plugins,
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    onSelect();

    emblaApi.on("select", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (!banners.length) return null;

  return (
    <div className="relative">
      {/* Slider */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner, index) => (
            <div key={banner._id} className="min-w-0 flex-[0_0_100%]">
              <HeroSlide
                banner={banner}
                priority={index === 0}
                hasMultiple={banners.length > 1}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      {banners.length > 1 && (
        <>
          <HeroArrow direction="left" onClick={scrollPrev} />
          <HeroArrow direction="right" onClick={scrollNext} />
          <HeroDots
            count={banners.length}
            current={selectedIndex}
            onSelect={scrollTo}
          />
        </>
      )}
    </div>
  );
}
