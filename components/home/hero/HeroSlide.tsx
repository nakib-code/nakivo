"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Tag } from "lucide-react";

import { HeroBanner } from "@/types/hero.types";

interface Props {
  banner: HeroBanner;
}

export default function HeroSlide({ banner }: Props) {
  return (
    <section
      className="
        relative
        h-[300px]
        overflow-hidden
        sm:h-[400px]
        md:h-[600px]
      "
    >
      {/* ================= BACKGROUND IMAGE ================= */}
      <Image
        src={banner.image}
        alt={banner.title}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      {/* ================= OVERLAY ================= */}
      <div
        className="
          absolute
          inset-0
          bg-gradient-to-r
          from-black/75
          via-black/40
          to-black/10
          sm:from-black/80
          sm:via-black/50
          sm:to-black/20
        "
      />

      {/* ================= CONTENT ================= */}
      <div
        className="
          relative
          z-10
          mx-auto
          flex
          h-full
          max-w-7xl
          items-center
          px-4
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            max-w-2xl
            text-white
          "
        >
          {/* ================= OFFER BADGE ================= */}
          {banner.active && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="
                mb-2
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                border-white/20
                bg-white/10
                px-2.5
                py-1
                backdrop-blur-md
                sm:mb-5
                sm:gap-2
                sm:px-4
                sm:py-2
              "
            >
              <Tag
                size={11}
                className="sm:h-[15px] sm:w-[15px]"
              />

              <span
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-wider
                  sm:text-sm
                "
              >
                Featured Collection
              </span>
            </motion.div>
          )}

          {/* ================= TITLE ================= */}
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="
              line-clamp-2
              text-2xl
              font-extrabold
              leading-tight
              tracking-tight
              sm:text-4xl
              md:text-6xl
            "
          >
            {banner.title}
          </motion.h1>

          {/* ================= DESCRIPTION ================= */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.15,
              duration: 0.5,
            }}
            className="
              mt-2
              line-clamp-2
              max-w-lg
              text-[11px]
              leading-4
              text-gray-200
              sm:mt-4
              sm:text-base
              sm:leading-6
              md:text-lg
              md:leading-7
            "
          >
            {banner.description}
          </motion.p>

          {/* ================= BUTTONS ================= */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.3,
              duration: 0.5,
            }}
            className="
              mt-4
              flex
              flex-wrap
              gap-2
              sm:mt-7
              sm:gap-3
              md:mt-10
              md:gap-4
            "
          >
            {/* Primary Button */}
            <Link
              href={banner.buttonLink}
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
              {banner.buttonText}

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

            {/* Explore Button */}
            <Link
              href="/products"
              className="
                inline-flex
                items-center
                rounded-lg
                border
                border-white/40
                bg-white/10
                px-3.5
                py-2
                text-[11px]
                font-semibold
                text-white
                backdrop-blur
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
              Explore Products
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
