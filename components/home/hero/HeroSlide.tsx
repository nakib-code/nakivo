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
    <section className="relative h-[520px] overflow-hidden md:h-[600px]">
      {/* Background Image */}
      <Image
        src={banner.image}
        alt={banner.title}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl text-white">

          {/* Offer Badge */}
          {banner.active && (
            <motion.div
              initial={{ opacity: 0, y: -25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-md"
            >
              <Tag size={15} />

              <span className="text-xs font-semibold uppercase tracking-wider sm:text-sm">
                Featured Collection
              </span>
            </motion.div>
          )}

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl"
          >
            {banner.title}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mt-5 max-w-xl text-base leading-7 text-gray-200 sm:text-lg"
          >
            {banner.description}
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 flex flex-wrap gap-3 sm:mt-10 sm:gap-4"
          >
            <Link
              href={banner.buttonLink}
              className="inline-flex items-center rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:scale-105 hover:shadow-lg sm:px-7"
            >
              {banner.buttonText}

              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>

            <Link
              href="/products"
              className="inline-flex items-center rounded-xl border border-white/40 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white hover:text-black sm:px-7"
            >
              Explore Products
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
