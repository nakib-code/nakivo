"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { HeroBanner } from "@/types/hero.types";

interface Props {
  banner: HeroBanner;
  priority?: boolean;
}

export default function HeroSlide({ banner, priority = false }: Props) {
  const primaryHref = banner.buttonLink?.trim() || "/products";
  const primaryLabel = banner.buttonText?.trim() || "Shop Now";

  return (
    <section
      aria-label={banner.title || "Hero banner"}
      className="
        relative
        aspect-[16/9]
        w-full
        max-h-[580px]
        overflow-hidden
        sm:aspect-[21/9]
        lg:aspect-[21/8]
      "
    >
      {/* ================= BACKGROUND IMAGE ================= */}
      {banner.image ? (
        <Image
          src={banner.image}
          alt={banner.title || "Promotional banner"}
          fill
          priority={priority}
          sizes="100vw"
          className="object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
      )}

      {/* ================= SUBTLE BOTTOM SCRIM FOR BUTTON LEGIBILITY ================= */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-0
          bottom-0
          h-2/5
          bg-gradient-to-t
          from-black/55
          via-black/15
          to-transparent
        "
      />

      {/* ================= ACTION BUTTONS ONLY ================= */}
      <div
        className="
          relative
          z-10
          mx-auto
          flex
          h-full
          max-w-7xl
          items-end
          px-4
          pb-7
          sm:px-6
          sm:pb-10
          lg:px-8
          md:pb-12
        "
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4"
        >
          {/* Primary Banner CTA */}
          <Link
            href={primaryHref}
            className="
              inline-flex
              items-center
              rounded-lg
              bg-primary
              px-3.5
              py-2
              text-[11px]
              font-semibold
              text-white
              shadow-md
              transition
              hover:scale-105
              hover:shadow-lg
              sm:rounded-xl
              sm:px-5
              sm:py-2.5
              sm:text-sm
              md:px-7
              md:py-3
              md:text-base
            "
          >
            {primaryLabel}

            <ArrowRight
              className="
                ml-1
                h-3.5
                w-3.5
                sm:ml-2
                sm:h-4
                sm:w-4
                md:h-5
                md:w-5
              "
            />
          </Link>

          {/* Secondary Explore More CTA */}
          <Link
            href="/products"
            className="
              inline-flex
              items-center
              rounded-lg
              border
              border-white/50
              bg-black/35
              px-3.5
              py-2
              text-[11px]
              font-semibold
              text-white
              backdrop-blur-sm
              transition
              hover:bg-white
              hover:text-black
              sm:rounded-xl
              sm:px-5
              sm:py-2.5
              sm:text-sm
              md:px-7
              md:py-3
              md:text-base
            "
          >
            Explore More
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
