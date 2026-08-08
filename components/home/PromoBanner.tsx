import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function PromoBanner() {
  return (
    <section className="w-full">
      <div
        className="
          mx-auto
          w-full
          max-w-[1600px]
          px-4
          sm:px-6
          lg:px-8
          xl:px-10
          2xl:px-12
        "
      >
        <div
          className="
            relative
            min-h-[420px]
            overflow-hidden
            rounded-3xl
            bg-slate-950
            sm:min-h-[460px]
            lg:min-h-[500px]
          "
        >
          {/* Background Image */}

          <Image
            src="/promo-banner.jpg"
            alt="Special promotion"
            fill
            priority={false}
            className="
              object-cover
              object-center
              transition-transform
              duration-1000
              hover:scale-105
            "
          />

          {/* Dark Overlay */}

          <div
            className="
              absolute
              inset-0
              bg-black/55
            "
          />

          {/* Gradient */}

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-r
              from-black/80
              via-black/50
              to-transparent
            "
          />

          {/* Content */}

          <div
            className="
              relative
              z-10
              flex
              min-h-[420px]
              max-w-2xl
              flex-col
              justify-center
              px-6
              py-12
              sm:min-h-[460px]
              sm:px-10
              lg:min-h-[500px]
              lg:px-14
              xl:px-16
            "
          >
            {/* Badge */}

            <div
              className="
                mb-5
                flex
                w-fit
                items-center
                gap-2
                rounded-full
                border
                border-white/20
                bg-white/10
                px-4
                py-2
                backdrop-blur-md
              "
            >
              <Sparkles
                size={15}
                className="text-yellow-400"
              />

              <span
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.2em]
                  text-white
                  sm:text-xs
                "
              >
                Special Offer
              </span>
            </div>

            {/* Heading */}

            <h2
              className="
                max-w-xl
                text-3xl
                font-black
                leading-tight
                tracking-tight
                text-white
                sm:text-4xl
                md:text-5xl
                lg:text-6xl
              "
            >
              Upgrade Your
              <span className="block text-white/70">
                Everyday Style.
              </span>
            </h2>

            {/* Description */}

            <p
              className="
                mt-5
                max-w-lg
                text-sm
                leading-6
                text-white/70
                sm:text-base
                sm:leading-7
              "
            >
              Discover premium products at prices
              designed to make your everyday shopping
              experience better.
            </p>

            {/* CTA */}

            <div className="mt-7">
              <Link
                href="/products"
                className="
                  group
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  bg-white
                  px-6
                  py-3.5
                  text-sm
                  font-bold
                  text-black
                  shadow-xl
                  transition-all
                  duration-300
                  hover:bg-slate-100
                  hover:gap-3
                  active:scale-95
                  sm:px-7
                "
              >
                Explore Collection

                <ArrowRight
                  size={17}
                  className="
                    transition-transform
                    duration-300
                    group-hover:translate-x-1
                  "
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
