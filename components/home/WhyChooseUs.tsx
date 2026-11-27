
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  ArrowUpRight,
} from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Fast Delivery",
    description:
      "Get your favorite products delivered quickly and safely to your doorstep.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    description:
      "Shop with confidence using secure and trusted payment methods.",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description:
      "Enjoy a simple and hassle-free return experience when you need it.",
  },
  {
    icon: Headphones,
    title: "Dedicated Support",
    description:
      "Our support team is ready to help whenever you need assistance.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="w-full bg-slate-50/70">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16 xl:px-10">
        {/* Section heading */}
        <div className="mx-auto mb-7 max-w-2xl text-center sm:mb-10">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 shadow-sm sm:text-xs">
            The NAKIVO Difference
          </span>

          <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl md:text-4xl lg:text-5xl">
            Shopping Made{" "}
            <span className="text-slate-400">Simple.</span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">
            Great products, reliable service, and a shopping
            experience designed around you.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 sm:p-7 lg:p-6 xl:p-7"
              >
                {/* Decorative number */}
                <span className="absolute right-5 top-5 text-xs font-bold tabular-nums text-slate-300 transition-colors duration-300 group-hover:text-slate-500">
                  0{index + 1}
                </span>

                {/* Icon */}
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 transition-all duration-300 group-hover:bg-slate-950 group-hover:text-white group-hover:shadow-lg sm:h-16 sm:w-16">
                  <Icon size={26} strokeWidth={1.7} />
                </div>

                {/* Text */}
                <h3 className="mt-6 text-base font-bold tracking-tight text-slate-950 sm:text-lg">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {feature.description}
                </p>

                {/* Bottom accent */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-semibold text-slate-400 transition-colors duration-300 group-hover:text-slate-700">
                    Shop with confidence
                  </span>

                  <ArrowUpRight
                    size={17}
                    className="text-slate-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-900"
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
