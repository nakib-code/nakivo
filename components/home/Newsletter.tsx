"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    setSubmitting(true);

    // Temporary frontend behavior.
    // Backend subscription API can be connected later.
    await new Promise((resolve) =>
      setTimeout(resolve, 700)
    );

    setSubmitting(false);
    setSubscribed(true);
    setEmail("");

    toast.success(
      "You're subscribed to our newsletter!"
    );
  };

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
        <div
          className="
            relative
            overflow-hidden
            rounded-3xl
            bg-slate-950
            px-5
            py-10
            text-white
            sm:px-8
            sm:py-14
            lg:px-12
            lg:py-16
          "
        >
          {/* Decorative circles */}

          <div
            className="
              pointer-events-none
              absolute
              -right-24
              -top-24
              h-64
              w-64
              rounded-full
              bg-white/5
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-32
              -left-20
              h-72
              w-72
              rounded-full
              bg-white/5
              blur-3xl
            "
          />

          <div
            className="
              relative
              z-10
              mx-auto
              max-w-3xl
              text-center
            "
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
                bg-white/10
                backdrop-blur-sm
                sm:h-16
                sm:w-16
              "
            >
              {subscribed ? (
                <CheckCircle
                  size={28}
                  className="text-emerald-400"
                />
              ) : (
                <Mail
                  size={28}
                  className="text-white"
                />
              )}
            </div>

            {/* Label */}

            <p
              className="
                mt-5
                text-[10px]
                font-bold
                uppercase
                tracking-[0.2em]
                text-white/50
                sm:text-xs
              "
            >
              Stay Updated
            </p>

            {/* Heading */}

            <h2
              className="
                mt-2
                text-2xl
                font-black
                tracking-tight
                sm:text-3xl
                md:text-4xl
              "
            >
              Get the latest deals
              <span className="block text-white/60">
                straight to your inbox.
              </span>
            </h2>

            {/* Description */}

            <p
              className="
                mx-auto
                mt-4
                max-w-xl
                text-xs
                leading-5
                text-white/60
                sm:text-sm
                sm:leading-6
              "
            >
              Subscribe to receive new arrivals, exclusive
              offers, and special discounts.
            </p>

            {/* Form */}

            {!subscribed ? (
              <form
                onSubmit={handleSubmit}
                className="
                  mx-auto
                  mt-7
                  flex
                  max-w-xl
                  flex-col
                  gap-3
                  sm:flex-row
                "
              >
                <div className="relative flex-1">
                  <Mail
                    size={17}
                    className="
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="Enter your email address"
                    aria-label="Email address"
                    className="
                      h-12
                      w-full
                      rounded-xl
                      border
                      border-white/10
                      bg-white
                      pl-11
                      pr-4
                      text-sm
                      text-slate-900
                      outline-none
                      placeholder:text-slate-400
                      focus:border-white
                      focus:ring-2
                      focus:ring-white/20
                    "
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="
                    group
                    flex
                    h-12
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-white
                    px-6
                    text-sm
                    font-bold
                    text-black
                    transition-all
                    duration-300
                    hover:bg-slate-100
                    hover:gap-3
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {submitting
                    ? "Subscribing..."
                    : "Subscribe"}

                  {!submitting && (
                    <ArrowRight
                      size={17}
                      className="
                        transition-transform
                        duration-300
                        group-hover:translate-x-1
                      "
                    />
                  )}
                </button>
              </form>
            ) : (
              <div
                className="
                  mx-auto
                  mt-7
                  flex
                  max-w-xl
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-emerald-400/20
                  bg-emerald-400/10
                  px-5
                  py-3.5
                  text-sm
                  font-semibold
                  text-emerald-300
                "
              >
                <CheckCircle size={18} />

                You're successfully subscribed!
              </div>
            )}

            {/* Privacy */}

            <p
              className="
                mt-4
                text-[10px]
                text-white/30
                sm:text-xs
              "
            >
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
