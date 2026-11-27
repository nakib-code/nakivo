
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function PromoBanner() {
  return (
    <section className="w-full py-4 sm:py-6 lg:py-8">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="relative isolate overflow-hidden rounded-2xl bg-slate-950 sm:rounded-3xl">
          {/* Background image */}
          <div className="absolute inset-0 -z-20">
            <Image
              src="/promo-banner.png"
              alt="Special collection promotion"
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 95vw, 1600px"
              className="object-cover object-center"
            />
          </div>

          {/* Dark overlay for readability */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/60 to-black/10 sm:from-black/80 sm:via-black/45 sm:to-transparent"
          />

          {/* Additional mobile overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-black/15 sm:bg-transparent"
          />

          {/* Content */}
          <div className="flex min-h-[300px] items-center px-5 py-8 sm:min-h-[380px] sm:px-10 sm:py-10 md:min-h-[420px] lg:min-h-[460px] lg:px-14 xl:px-16">
            <div className="max-w-2xl">
              {/* Badge */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 backdrop-blur-md sm:mb-6">
                <Sparkles
                  size={15}
                  className="text-yellow-400"
                />

                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white sm:text-xs">
                  Special Offer
                </span>
              </div>

              {/* Heading */}
              <h2 className="max-w-xl text-3xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                Upgrade Your
                <span className="mt-1 block text-yellow-400">
                  Everyday Style.
                </span>
              </h2>

              {/* Description */}
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/85 sm:mt-5 sm:text-base sm:leading-7">
                Discover premium products at amazing prices
                and find everything you need to elevate your
                everyday shopping experience.
              </p>

              {/* CTA */}
              <div className="mt-7 sm:mt-8">
                <Link
                  href="/products"
                  className="group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-black/20 transition-all duration-300 hover:bg-yellow-400 hover:shadow-xl active:scale-[0.98] sm:px-7"
                >
                  Explore Collection

                  <ArrowRight
                    size={17}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
              </div>

              {/* Supporting text */}
              <p className="mt-4 text-xs font-medium text-white/60">
                Discover your next favorite.
              </p>
            </div>
          </div>

          {/* Bottom accent */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-transparent"
          />
        </div>
      </div>
    </section>
  );
}
