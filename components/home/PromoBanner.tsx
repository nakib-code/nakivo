
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function PromoBanner() {
  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="relative isolate min-h-[380px] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-800 to-indigo-950 sm:min-h-[420px] lg:min-h-[460px]">

          {/* Background Color */}
          <div className="absolute inset-0 -z-20 bg-gradient-to-br from-slate-950 via-slate-800 to-indigo-950" />

          {/* Background Image */}
          <Image
            src="/promo-banner.png"
            alt="NAKIVO special fashion promotion"
            fill
            priority
            sizes="(max-width: 1600px) 100vw, 1600px"
            className="-z-10 object-contain object-center"
          />

          {/* Overlay */}
          <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />

          {/* Content */}
          <div className="relative z-10 flex min-h-[380px] max-w-2xl flex-col justify-center px-5 py-10 sm:min-h-[420px] sm:px-10 lg:min-h-[460px] lg:px-14 xl:px-16">

            {/* Badge */}
            <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-white/25 bg-black/25 px-4 py-2 backdrop-blur-sm">
              <Sparkles size={15} className="text-yellow-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white sm:text-xs">
                Special Offer
              </span>
            </div>

            {/* Heading */}
            <h2 className="max-w-xl text-3xl font-black leading-tight tracking-tight text-white drop-shadow-md sm:text-4xl md:text-5xl lg:text-6xl">
              Upgrade Your
              <span className="block text-white/90">
                Everyday Style.
              </span>
            </h2>

            {/* Description */}
            <p className="mt-5 max-w-lg text-sm leading-6 text-white/90 sm:text-base sm:leading-7">
              Discover premium products at prices designed to make your everyday shopping experience better.
            </p>

            {/* CTA Button */}
            <div className="mt-7">
              <Link
                href="/products"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-black shadow-xl transition-all duration-300 hover:gap-3 hover:bg-slate-100 active:scale-95 sm:px-7"
              >
                Explore Collection
                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
