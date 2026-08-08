"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Tag } from "lucide-react";
import { HeroBanner } from "@/types/hero.types";


interface Props {
  banner: HeroBanner;
}

export default function HeroSlide({ banner }: Props) {
  return (
    <section className="relative h-[520px] md:h-[620px] lg:h-[700px] overflow-hidden">
      {/* Background Image */}
      <img
        src={banner.image}
        alt={banner.title}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6">
        <div className="max-w-2xl text-white">

          {/* Offer Badge */}
          {banner.offerText && (
            <motion.div
              initial={{ opacity: 0, y: -25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: .5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 backdrop-blur-md"
            >
              <Tag size={16} />
              <span className="text-sm font-medium">
                {banner.offerText}
              </span>
            </motion.div>
          )}

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .6 }}
            className="text-4xl font-extrabold leading-tight md:text-6xl"
          >
            {banner.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.h2
            initial={{ opacity: 0, y: 45 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .15 }}
            className="mt-5 text-xl font-semibold text-primary md:text-2xl"
          >
            {banner.subtitle}
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: .3 }}
            className="mt-6 max-w-xl text-base leading-7 text-gray-200"
          >
            {banner.description}
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: .4 }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <Link
              href={banner.buttonLink}
              className="inline-flex items-center rounded-xl bg-primary px-7 py-3 font-semibold text-white transition hover:scale-105"
            >
              {banner.buttonText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>

            <Link
              href="/products"
              className="rounded-xl border border-white/40 bg-white/10 px-7 py-3 font-semibold backdrop-blur hover:bg-white hover:text-black transition"
            >
              Explore Products
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}