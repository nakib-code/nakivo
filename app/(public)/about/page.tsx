
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Curated Products",
    description:
      "We carefully select products that balance quality, style, and everyday usefulness.",
  },
  {
    icon: ShieldCheck,
    title: "Quality First",
    description:
      "Our goal is to make quality products accessible without compromising the shopping experience.",
  },
  {
    icon: Truck,
    title: "Simple Shopping",
    description:
      "From discovery to checkout, we keep the shopping experience simple, fast, and convenient.",
  },
  {
    icon: Heart,
    title: "Customer Focused",
    description:
      "Every part of our store is designed around what makes online shopping easier for you.",
  },
];

const stats = [
  { value: "100+", label: "Products" },
  { value: "4+", label: "Categories" },
  { value: "24/7", label: "Online Shopping" },
  { value: "100%", label: "Customer Focus" },
];

const containerClass =
  "mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12";

export default function AboutPage() {
  return (
    <main className="overflow-hidden bg-white text-slate-950">
      {/* Hero Section */}
      <section className="border-b border-slate-100">
        <div
          className={`${containerClass} grid items-center gap-10 py-12 sm:gap-12 sm:py-16 lg:min-h-[560px] lg:grid-cols-2 lg:gap-14 lg:py-20`}
        >
          {/* Content */}
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 sm:px-4">
              <Sparkles
                size={14}
                aria-hidden="true"
                className="text-slate-700"
              />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600 sm:text-xs">
                About NAKIVO
              </span>
            </div>

            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:mt-6 sm:text-5xl md:text-6xl lg:text-7xl">
              Shopping made{" "}
              <span className="text-slate-400">simple.</span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500 sm:mt-6 sm:text-base lg:text-lg">
              NAKIVO is a modern online store built to
              bring quality products, simple discovery,
              and a smooth shopping experience together
              in one place.
            </p>

            <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row sm:mt-8">
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 sm:px-6"
              >
                Explore Products
                <ArrowRight size={16} aria-hidden="true" />
              </Link>

            </div>
          </div>

          {/* Brand Visual */}
          <div className="min-w-0">
            <div className="relative isolate flex aspect-square w-full flex-col justify-between overflow-hidden rounded-3xl bg-slate-950 p-5 shadow-xl sm:rounded-[2rem] sm:p-8 md:p-10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 -z-10 size-56 rounded-full bg-white/10 blur-3xl sm:size-72"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-16 -left-16 -z-10 size-56 rounded-full bg-white/10 blur-3xl sm:size-72"
              />

              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold tracking-[0.2em] text-white sm:text-sm">
                  NAKIVO
                </span>

                <Sparkles
                  size={20}
                  aria-hidden="true"
                  className="text-white/60"
                />
              </div>

              <div className="py-8">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-white/50 sm:text-sm">
                  OUR PHILOSOPHY
                </p>

                <h2 className="mt-3 max-w-md text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                  Quality products.
                  <br />
                  Better experience.
                </h2>

                <div className="mt-5 h-1 w-14 rounded-full bg-white/60 sm:mt-6" />
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-medium text-white/40 sm:text-xs">
                  EST. 2026
                </span>

                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 sm:text-xs sm:tracking-widest">
                  SHOP SMART
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section
        aria-label="Store highlights"
        className="border-b border-slate-100"
      >
        <div
          className={`${containerClass} grid grid-cols-2 divide-x divide-y divide-slate-100 lg:grid-cols-4 lg:divide-y-0`}
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex min-w-0 flex-col items-center justify-center px-2 py-6 text-center sm:px-4 sm:py-8 lg:py-10"
            >
              <p className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                {stat.value}
              </p>

              <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[11px] md:text-xs">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story */}
      <section>
        <div
          className={`${containerClass} grid gap-6 py-14 sm:gap-8 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-28`}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Our Story
            </p>

            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Built around better
              <br className="hidden sm:block" /> online shopping.
            </h2>
          </div>

          <div className="space-y-4 text-sm leading-7 text-slate-500 sm:space-y-5 sm:text-base">
            <p>
              We believe online shopping should not feel
              complicated. Finding the right product,
              understanding what you are buying, and
              completing your order should all feel
              natural.
            </p>

            <p>
              That&apos;s why NAKIVO focuses on a clean
              experience, carefully selected products,
              straightforward navigation, and a modern
              shopping environment.
            </p>

            <p>
              As the store grows, our goal remains the
              same: make every visit useful, every
              purchase simple, and every customer feel
              confident about shopping with us.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-slate-50">
        <div className={`${containerClass} py-14 sm:py-20 lg:py-24`}>
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Why NAKIVO
            </p>

            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              Designed for a better shopping experience.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
              Everything we do comes back to making
              shopping easier, clearer, and more enjoyable.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4 xl:gap-5">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg sm:rounded-3xl sm:p-6"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-white transition-transform duration-300 group-hover:scale-105 sm:size-11">
                    <Icon size={19} aria-hidden="true" />
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-950 sm:mt-5">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section>
        <div className={`${containerClass} py-12 sm:py-16 lg:py-24`}>
          <div className="relative isolate overflow-hidden rounded-3xl bg-black px-5 py-10 text-center sm:rounded-[2rem] sm:px-10 sm:py-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 -z-10 size-64 rounded-full bg-white/10 blur-3xl"
            />

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              Start Shopping
            </p>

            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
              Find something you&apos;ll love.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
              Explore our collection and discover products
              selected for your everyday needs.
            </p>

            <Link
              href="/products"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:mt-8"
            >
              Shop Now
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
