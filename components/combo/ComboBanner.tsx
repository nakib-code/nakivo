"use client";

import { CheckCircle2, Layers, PackagePlus, Sparkles } from "lucide-react";

import { COMBO_MIN_ITEMS, type ComboSelectionStatus } from "@/lib/combo";

interface ComboBannerProps {
  status: ComboSelectionStatus;
}

export default function ComboBanner({ status }: ComboBannerProps) {
  return (
    <section
      aria-label="Combo Offer Banner"
      className="relative isolate overflow-hidden rounded-2xl bg-slate-950 text-white shadow-xl sm:rounded-3xl"
    >
      {/* Subtle decorative gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl"
      />

      <div className="relative px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Offer Copy */}
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
                Custom Combo Builder
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-black leading-snug tracking-tight text-white sm:text-3xl lg:text-4xl">
              কম্বো হলে কমপক্ষে ৩টি প্রোডাক্ট নিন।
            </h1>

            <p className="mt-2.5 text-sm font-medium leading-relaxed text-slate-200 sm:text-base lg:text-lg">
              যেকোনো ৩টি বা তার বেশি আইটেম সিলেক্ট করে কম্বো তৈরি করুন।
            </p>

            <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
              Mix and match any {COMBO_MIN_ITEMS} or more in-stock products to
              build your custom combo — no upper limit.
            </p>
          </div>

          {/* Right: Live Progress Card */}
          <div className="w-full shrink-0 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:p-5 lg:w-80">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                {status.isReady ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Layers className="h-4 w-4 text-amber-400" />
                )}
                Combo Progress
              </span>

              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  status.isReady
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/20 text-amber-300"
                }`}
              >
                {status.selectedCount} / {status.minItems}+ items
              </span>
            </div>

            {/* 3-step visual bar */}
            <div
              className="mt-3 grid grid-cols-3 gap-1.5"
              role="progressbar"
              aria-valuenow={Math.min(status.selectedCount, status.minItems)}
              aria-valuemin={0}
              aria-valuemax={status.minItems}
              aria-label="Combo minimum items progress"
            >
              {Array.from({ length: status.minItems }).map((_, index) => {
                const filled = status.selectedCount > index;
                return (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-colors duration-300 ${
                      filled
                        ? status.isReady
                          ? "bg-emerald-400"
                          : "bg-amber-400"
                        : "bg-white/20"
                    }`}
                  />
                );
              })}
            </div>

            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-200">
              <PackagePlus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
              <span>{status.statusMessage}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div
        aria-hidden="true"
        className={`h-1 w-full transition-colors duration-300 ${
          status.isReady
            ? "bg-gradient-to-r from-emerald-400 via-teal-400 to-transparent"
            : "bg-gradient-to-r from-amber-400 via-orange-400 to-transparent"
        }`}
      />
    </section>
  );
}
