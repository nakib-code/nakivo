"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import {
  DEFAULT_PRIMARY_BUTTON_LINK,
  DEFAULT_PRIMARY_BUTTON_TEXT,
  DEFAULT_SECONDARY_BUTTON_LINK,
  DEFAULT_SECONDARY_BUTTON_TEXT,
} from "@/lib/hero";
import type { HeroBanner } from "@/types/hero.types";

interface Props {
  banner: HeroBanner;
  priority?: boolean;
  hasMultiple?: boolean;
}

export default function HeroSlide({
  banner,
  priority = false,
  hasMultiple = false,
}: Props) {
  const primaryHref =
    banner.primaryButtonLink?.trim() || DEFAULT_PRIMARY_BUTTON_LINK;
  const primaryLabel =
    banner.primaryButtonText?.trim() || DEFAULT_PRIMARY_BUTTON_TEXT;
  const secondaryHref =
    banner.secondaryButtonLink?.trim() || DEFAULT_SECONDARY_BUTTON_LINK;
  const secondaryLabel =
    banner.secondaryButtonText?.trim() || DEFAULT_SECONDARY_BUTTON_TEXT;

  return (
    <section
      aria-label="Hero banner"
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
          alt="Promotional hero banner"
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

      {/* ================= TWO ACTION BUTTONS AT THE BOTTOM ================= */}
      <div
        className={`
          relative
          z-10
          mx-auto
          flex
          h-full
          max-w-7xl
          items-end
          justify-center
          px-4
          sm:px-6
          lg:px-8
          ${
            hasMultiple
              ? "pb-9 sm:pb-12 md:pb-14"
              : "pb-5 sm:pb-8 md:pb-10"
          }
        `}
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 md:gap-4"
        >
          {/* Button 1 (Primary) */}
          <Link
            href={primaryHref}
            className="
              inline-flex
              items-center
              justify-center
              rounded-lg
              bg-primary
              px-4
              py-2
              text-xs
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
                ml-1.5
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

          {/* Button 2 (Secondary) */}
          <Link
            href={secondaryHref}
            className="
              inline-flex
              items-center
              justify-center
              rounded-lg
              border
              border-white/55
              bg-black/40
              px-4
              py-2
              text-xs
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
            {secondaryLabel}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
