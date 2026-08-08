import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
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
      "Your payments are protected with secure and trusted payment methods.",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description:
      "Not satisfied? Enjoy a simple and hassle-free return experience.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description:
      "Our support team is always ready to help whenever you need us.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="w-full">
      <div
        className="
          mx-auto
          w-full
          max-w-[1600px]
          px-4
          py-12
          sm:px-6
          sm:py-16
          lg:px-8
          xl:px-10
          2xl:px-12
        "
      >
        {/* Header */}

        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <p
            className="
              mb-2
              text-[10px]
              font-bold
              uppercase
              tracking-[0.2em]
              text-slate-400
              sm:text-xs
            "
          >
            Why Choose Us
          </p>

          <h2
            className="
              text-2xl
              font-black
              tracking-tight
              text-slate-950
              sm:text-3xl
              md:text-4xl
            "
          >
            Shopping Made Simple
          </h2>

          <p
            className="
              mt-3
              text-xs
              leading-5
              text-slate-500
              sm:text-sm
              sm:leading-6
            "
          >
            Everything you need for a smooth, secure,
            and enjoyable shopping experience.
          </p>
        </div>

        {/* Features */}

        <div
          className="
            grid
            grid-cols-1
            overflow-hidden
            rounded-3xl
            border
            border-slate-200
            bg-white
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className={`
                  group
                  relative
                  p-6
                  text-center
                  transition-colors
                  duration-300
                  hover:bg-slate-50
                  sm:p-8
                  ${
                    index !== 0
                      ? "border-t sm:border-t-0 sm:border-l border-slate-200"
                      : ""
                  }
                  ${
                    index === 2
                      ? "lg:border-l"
                      : ""
                  }
                `}
              >
                {/* Icon */}

                <div
                  className="
                    mx-auto
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-slate-100
                    text-slate-900
                    transition-all
                    duration-300
                    group-hover:scale-110
                    group-hover:bg-black
                    group-hover:text-white
                    sm:h-16
                    sm:w-16
                  "
                >
                  <Icon
                    size={25}
                    strokeWidth={1.8}
                  />
                </div>

                {/* Title */}

                <h3
                  className="
                    mt-5
                    text-base
                    font-bold
                    text-slate-900
                    sm:text-lg
                  "
                >
                  {feature.title}
                </h3>

                {/* Description */}

                <p
                  className="
                    mx-auto
                    mt-2
                    max-w-xs
                    text-xs
                    leading-5
                    text-slate-500
                    sm:text-sm
                    sm:leading-6
                  "
                >
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
