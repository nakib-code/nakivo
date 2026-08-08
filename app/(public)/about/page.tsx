import Link from "next/link";
import {
  ArrowRight,
  Award,
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
  {
    value: "100+",
    label: "Products",
  },
  {
    value: "4+",
    label: "Categories",
  },
  {
    value: "24/7",
    label: "Online Shopping",
  },
  {
    value: "100%",
    label: "Customer Focus",
  },
];

export default function AboutPage() {
  return (
    <main className="bg-white">
      {/* =====================================
          HERO
      ===================================== */}

      <section className="border-b border-slate-100">
        <div
          className="
            mx-auto
            grid
            min-h-[560px]
            w-full
            max-w-[1600px]
            items-center
            gap-12
            px-4
            py-16
            sm:px-6
            lg:grid-cols-2
            lg:px-8
            lg:py-20
            xl:px-10
            2xl:px-12
          "
        >
          {/* Content */}

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
              <Sparkles
                size={14}
                className="text-slate-700"
              />

              <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-600">
                About Bagddash
              </span>
            </div>

            <h1
              className="
                mt-6
                max-w-3xl
                text-5xl
                font-black
                leading-[1.05]
                tracking-tight
                text-slate-950
                sm:text-6xl
                lg:text-7xl
              "
            >
              Shopping made
              <span className="text-slate-400">
                {" "}
                simple.
              </span>
            </h1>

            <p
              className="
                mt-6
                max-w-2xl
                text-base
                leading-7
                text-slate-500
                sm:text-lg
              "
            >
              Bagddash is a modern online store built
              to bring quality products, simple
              discovery, and a smooth shopping
              experience together in one place.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-black
                  px-6
                  py-3.5
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-slate-800
                "
              >
                Explore Products
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/products?sort=newest"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  px-6
                  py-3.5
                  text-sm
                  font-bold
                  text-slate-700
                  transition
                  hover:bg-slate-50
                  hover:text-black
                "
              >
                New Arrivals
              </Link>
            </div>
          </div>

          {/* Visual */}

          <div className="relative">
            <div
              className="
                relative
                aspect-square
                overflow-hidden
                rounded-[2rem]
                bg-slate-950
                p-6
                shadow-2xl
                sm:p-10
              "
            >
              <div
                className="
                  absolute
                  -right-20
                  -top-20
                  h-64
                  w-64
                  rounded-full
                  bg-white/10
                  blur-3xl
                "
              />

              <div
                className="
                  absolute
                  -bottom-20
                  -left-20
                  h-64
                  w-64
                  rounded-full
                  bg-white/10
                  blur-3xl
                "
              />

              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold tracking-wide text-white">
                    BAGDDASH
                  </span>

                  <Sparkles
                    size={20}
                    className="text-white/60"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-white/50">
                    OUR PHILOSOPHY
                  </p>

                  <h2 className="mt-3 max-w-md text-3xl font-black tracking-tight text-white sm:text-4xl">
                    Quality products.
                    <br />
                    Better experience.
                  </h2>
                </div>

                <div className="flex items-end justify-between">
                  <span className="text-xs font-medium text-white/40">
                    EST. 2026
                  </span>

                  <span className="text-xs font-bold uppercase tracking-widest text-white/60">
                    SHOP SMART
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          STATS
      ===================================== */}

      <section className="border-b border-slate-100">
        <div
          className="
            mx-auto
            grid
            w-full
            max-w-[1600px]
            grid-cols-2
            divide-x
            divide-y
            divide-slate-100
            px-4
            sm:px-6
            lg:grid-cols-4
            lg:divide-y-0
            lg:px-8
            xl:px-10
            2xl:px-12
          "
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="px-4 py-8 text-center sm:px-6 lg:py-10"
            >
              <p className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                {stat.value}
              </p>

              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================
          STORY
      ===================================== */}

      <section>
        <div
          className="
            mx-auto
            grid
            w-full
            max-w-[1600px]
            gap-12
            px-4
            py-20
            sm:px-6
            lg:grid-cols-2
            lg:items-center
            lg:px-8
            lg:py-28
            xl:px-10
            2xl:px-12
          "
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Our Story
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Built around better
              <br className="hidden sm:block" />
              online shopping.
            </h2>
          </div>

          <div className="space-y-5 text-sm leading-7 text-slate-500 sm:text-base">
            <p>
              We believe online shopping should not feel
              complicated. Finding the right product,
              understanding what you are buying, and
              completing your order should all feel
              natural.
            </p>

            <p>
              That's why Bagddash focuses on a clean
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

      {/* =====================================
          FEATURES
      ===================================== */}

      <section className="bg-slate-50">
        <div
          className="
            mx-auto
            w-full
            max-w-[1600px]
            px-4
            py-20
            sm:px-6
            lg:px-8
            lg:py-24
            xl:px-10
            2xl:px-12
          "
        >
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Why Bagddash
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Designed for a better
              shopping experience.
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-500 sm:text-base">
              Everything we do comes back to making
              shopping easier, clearer, and more
              enjoyable.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="
                    rounded-3xl
                    border
                    border-slate-200
                    bg-white
                    p-6
                    transition
                    hover:-translate-y-1
                    hover:shadow-lg
                  "
                >
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-xl
                      bg-slate-950
                      text-white
                    "
                  >
                    <Icon size={19} />
                  </div>

                  <h3 className="mt-5 font-bold text-slate-950">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================
          CTA
      ===================================== */}

      <section>
        <div
          className="
            mx-auto
            w-full
            max-w-[1600px]
            px-4
            py-16
            sm:px-6
            lg:px-8
            lg:py-24
            xl:px-10
            2xl:px-12
          "
        >
          <div
            className="
              overflow-hidden
              rounded-[2rem]
              bg-black
              px-6
              py-12
              text-center
              sm:px-10
              sm:py-16
            "
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
              Start Shopping
            </p>

            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
              Find something you'll love.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/50 sm:text-base">
              Explore our collection and discover
              products selected for your everyday needs.
            </p>

            <Link
              href="/products"
              className="
                mt-8
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-white
                px-6
                py-3.5
                text-sm
                font-bold
                text-black
                transition
                hover:bg-slate-200
              "
            >
              Shop Now
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
