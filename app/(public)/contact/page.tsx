"use client";

import { FormEvent, useState } from "react";
import {
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "hello@bagddash.com",
    description: "We'll reply as soon as possible.",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "+880 1856-682104",
    description: "Available during business hours.",
  },
  {
    icon: MapPin,
    title: "Location",
    value: "Dhaka, Bangladesh",
    description: "Serving customers online.",
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] =
    useState(false);

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    // Temporary frontend-only submission.
    // Connect this form to an API/email service later.
    setSubmitted(true);
  };

  return (
    <main className="bg-white">
      {/* =====================================
          HEADER
      ===================================== */}

      <section className="border-b border-slate-100">
        <div
          className="
            mx-auto
            w-full
            max-w-[1600px]
            px-4
            py-16
            sm:px-6
            sm:py-20
            lg:px-8
            lg:py-24
            xl:px-10
            2xl:px-12
          "
        >
          <div className="max-w-3xl">
            <p
              className="
                text-xs
                font-bold
                uppercase
                tracking-[0.2em]
                text-slate-400
              "
            >
              Get In Touch
            </p>

            <h1
              className="
                mt-3
                text-5xl
                font-black
                tracking-tight
                text-slate-950
                sm:text-6xl
              "
            >
              Contact us.
            </h1>

            <p
              className="
                mt-5
                max-w-2xl
                text-base
                leading-7
                text-slate-500
                sm:text-lg
              "
            >
              Have a question about an order, product,
              delivery, or anything else? Send us a
              message and we'll get back to you.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================
          CONTACT CONTENT
      ===================================== */}

      <section>
        <div
          className="
            mx-auto
            grid
            w-full
            max-w-[1600px]
            gap-10
            px-4
            py-12
            sm:px-6
            sm:py-16
            lg:grid-cols-[0.8fr_1.2fr]
            lg:px-8
            lg:py-20
            xl:px-10
            2xl:px-12
          "
        >
          {/* Contact Information */}

          <div>
            <div className="space-y-4">
              {contactInfo.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="
                      rounded-2xl
                      border
                      border-slate-200
                      bg-slate-50
                      p-5
                    "
                  >
                    <div className="flex gap-4">
                      <div
                        className="
                          flex
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          bg-black
                          text-white
                        "
                      >
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {item.title}
                        </p>

                        <p className="mt-1 break-words font-bold text-slate-900">
                          {item.value}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Support */}

            <div className="mt-8 rounded-3xl bg-black p-7 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">
                Customer Support
              </p>

              <h2 className="mt-3 text-2xl font-black">
                We're here to help.
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/50">
                Whether you need help with an order or
                simply want to know more about a product,
                don't hesitate to reach out.
              </p>
            </div>
          </div>

          {/* Contact Form */}

          <div
            className="
              rounded-3xl
              border
              border-slate-200
              bg-white
              p-5
              shadow-sm
              sm:p-8
            "
          >
            {submitted ? (
              <div
                className="
                  flex
                  min-h-[500px]
                  flex-col
                  items-center
                  justify-center
                  px-4
                  text-center
                "
              >
                <div
                  className="
                    flex
                    h-16
                    w-16
                    items-center
                    justify-center
                    rounded-full
                    bg-green-50
                    text-green-600
                  "
                >
                  <CheckCircle2 size={30} />
                </div>

                <h2 className="mt-6 text-2xl font-black text-slate-950">
                  Message received!
                </h2>

                <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                  Thank you for contacting us. Our team
                  will get back to you as soon as
                  possible.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setSubmitted(false)
                  }
                  className="
                    mt-7
                    rounded-xl
                    border
                    border-slate-200
                    px-5
                    py-3
                    text-sm
                    font-bold
                    text-slate-700
                    transition
                    hover:bg-slate-50
                  "
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Send a Message
                  </p>

                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    How can we help?
                  </h2>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  {/* Name */}

                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Your Name
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="Enter your name"
                      className="
                        h-12
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50
                        px-4
                        text-sm
                        outline-none
                        transition
                        placeholder:text-slate-400
                        focus:border-black
                        focus:bg-white
                      "
                    />
                  </div>

                  {/* Email */}

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Email Address
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="
                        h-12
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50
                        px-4
                        text-sm
                        outline-none
                        transition
                        placeholder:text-slate-400
                        focus:border-black
                        focus:bg-white
                      "
                    />
                  </div>

                  {/* Subject */}

                  <div>
                    <label
                      htmlFor="subject"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Subject
                    </label>

                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      placeholder="How can we help?"
                      className="
                        h-12
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50
                        px-4
                        text-sm
                        outline-none
                        transition
                        placeholder:text-slate-400
                        focus:border-black
                        focus:bg-white
                      "
                    />
                  </div>

                  {/* Message */}

                  <div>
                    <label
                      htmlFor="message"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Message
                    </label>

                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      placeholder="Write your message..."
                      className="
                        w-full
                        resize-none
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50
                        p-4
                        text-sm
                        outline-none
                        transition
                        placeholder:text-slate-400
                        focus:border-black
                        focus:bg-white
                      "
                    />
                  </div>

                  {/* Submit */}

                  <button
                    type="submit"
                    className="
                      inline-flex
                      h-12
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-black
                      px-6
                      text-sm
                      font-bold
                      text-white
                      transition
                      hover:bg-slate-800
                    "
                  >
                    Send Message
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
