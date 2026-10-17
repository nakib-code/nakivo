
"use client";

import { useState, type FormEvent } from "react";
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
    href: "mailto:hello@bagddash.com",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "+880 1856-682104",
    description: "Available during business hours.",
    href: "tel:+8801856682104",
  },
  {
    icon: MapPin,
    title: "Location",
    value: "Dhaka, Bangladesh",
    description: "Serving customers online.",
    href: undefined,
  },
];

const containerClass =
  "mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12";

const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const subject = String(formData.get("subject") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!name || !email || !subject || !message) {
      form.reportValidity();
      return;
    }

    // Frontend demo only: no message is sent to a server yet.
    setIsSubmitting(true);

    try {
      setSubmitted(true);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* Page Header */}
      <section className="border-b border-slate-100">
        <div className={`${containerClass} py-12 sm:py-16 lg:py-20`}>
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 sm:text-sm">
              Get In Touch
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Contact us<span className="text-slate-400">.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
              Have a question about an order, product, delivery, or anything
              else? Send us a message and our team will be happy to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section aria-label="Contact information and message form">
        <div
          className={`${containerClass} grid gap-8 py-8 sm:gap-10 sm:py-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12 lg:py-16`}
        >
          {/* Contact Information */}
          <aside className="flex flex-col">
            <div className="mb-5">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Contact Information
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Choose your preferred way to get in touch with us.
              </p>
            </div>

            <div className="space-y-3">
              {contactInfo.map((item) => {
                const Icon = item.icon;

                const content = (
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white transition-colors group-hover:bg-slate-700">
                      <Icon size={19} aria-hidden="true" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {item.title}
                      </p>

                      <p className="mt-1 break-words text-sm font-bold text-slate-900 sm:text-base">
                        {item.value}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );

                return (
                  <div
                    key={item.title}
                    className="group rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 sm:p-5"
                  >
                    {item.href ? (
                      <a
                        href={item.href}
                        aria-label={`${item.title}: ${item.value}`}
                        className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-4"
                      >
                        {content}
                      </a>
                    ) : (
                      content
                    )}
                  </div>
                );
              })}
            </div>

            {/* Customer Support */}
            <div className="mt-5 rounded-2xl bg-slate-950 p-6 text-white sm:mt-6 sm:rounded-3xl sm:p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <Mail size={20} aria-hidden="true" />
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
                Customer Support
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight">
                We&apos;re here to help.
              </h2>

              <p className="mt-3 text-sm leading-7 text-white/65">
                Whether you need help with an order or want to know more about
                a product, don&apos;t hesitate to reach out.
              </p>

              <a
                href="mailto:hello@bagddash.com"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white underline-offset-4 transition hover:underline"
              >
                Email our team
                <Send size={15} aria-hidden="true" />
              </a>
            </div>
          </aside>

          {/* Contact Form */}
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-8 lg:p-10">
            {submitted ? (
              <div
                role="status"
                aria-live="polite"
                className="flex min-h-[360px] flex-col items-center justify-center px-3 py-10 text-center sm:min-h-[450px] sm:px-6"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={32} aria-hidden="true" />
                </div>

                <h2 className="mt-6 text-2xl font-black tracking-tight">
                  Message received!
                </h2>

                <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                  Thank you for reaching out. This is a frontend demo, so your
                  message has not actually been sent. Connect the form to your
                  backend to receive real messages.
                </p>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
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

                  <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                    How can we help?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Fill in the details below and let us know how we can assist
                    you.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Your Name
                    </label>

                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      maxLength={100}
                      placeholder="Enter your name"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Email Address
                    </label>

                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Subject
                    </label>

                    <input
                      id="contact-subject"
                      name="subject"
                      type="text"
                      required
                      maxLength={150}
                      placeholder="How can we help?"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Message
                    </label>

                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={6}
                      maxLength={5000}
                      placeholder="Write your message..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                    <Send size={16} aria-hidden="true" />
                  </button>

                  <p className="text-center text-xs leading-5 text-slate-400">
                    Your information should be handled securely. Please avoid
                    including sensitive personal details.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
