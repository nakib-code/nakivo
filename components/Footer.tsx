import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  MapPin,
  Phone,
  ArrowUpRight,
} from "lucide-react";
import { CookiePreferencesButton } from "@/components/marketing/CookieConsentBanner";

const baseShopLinks = [
  { label: "All Products", href: "/products" },
  { label: "Combo Deals", href: "/combo" },
];

const supportLinks = [
  { label: "My Account", href: "/user" },
  { label: "My Orders", href: "/user/orders" },
  { label: "Shopping Cart", href: "/cart" },
  { label: "Contact Us", href: "/contact" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Shop All", href: "/products" },
  { label: "Contact Support", href: "/contact" },
];

interface FooterCategory {
  name: string;
  slug: string;
}

interface FooterProps {
  siteName?: string;
  logoUrl?: string;
  categories?: FooterCategory[];
}

export default function Footer({
  siteName = "NAKIVO",
  logoUrl = "",
  categories = [],
}: FooterProps) {
  const displayName = siteName.trim() || "NAKIVO";
  const initial = displayName.charAt(0).toUpperCase();
  const shopLinks = [
    ...baseShopLinks,
    ...categories.slice(0, 3).map((cat) => ({
      label: cat.name,
      href: `/category/${cat.slug}`,
    })),
  ];

  return (
    <footer className="border-t border-white/10 bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Main Footer */}
        <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:gap-10 lg:py-16">
          {/* Brand & Contact */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              aria-label={`${displayName} home`}
              className="group inline-flex items-center gap-3"
            >
              {logoUrl ? (
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 transition-transform duration-300 group-hover:rotate-3">
                  <Image
                    src={logoUrl}
                    alt={displayName}
                    fill
                    sizes="44px"
                    className="object-contain p-1"
                  />
                </span>
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-black text-slate-950 transition-transform duration-300 group-hover:rotate-3">
                  {initial}
                </span>
              )}

              <span className="text-2xl font-black tracking-tight">
                {displayName}
                <span className="text-slate-400">.</span>
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              Discover quality products, modern style, and everyday
              essentials—all in one place. We make online shopping
              simple, reliable, and enjoyable.
            </p>

            {/* Contact Information */}
            <div className="mt-6 space-y-4">
              <a
                href="mailto:support@nakivo.com"
                className="group flex w-fit items-center gap-3 text-sm text-slate-400 transition-colors hover:text-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors group-hover:bg-white group-hover:text-slate-950">
                  <Mail size={16} />
                </span>
                support@nakivo.com
              </a>

              <a
                href="tel:+8801856682104"
                className="group flex w-fit items-center gap-3 text-sm text-slate-400 transition-colors hover:text-white"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-colors group-hover:bg-white group-hover:text-slate-950">
                  <Phone size={16} />
                </span>
                +880 1856-682104
              </a>

              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <MapPin size={16} />
                </span>
                Dhaka, Bangladesh
              </div>
            </div>
          </div>

          {/* Shop */}
          <FooterColumn title="Shop" links={shopLinks} />

          {/* Support */}
          <FooterColumn title="Customer Support" links={supportLinks} />

          {/* Company */}
          <FooterColumn title="Company" links={companyLinks} />
        </div>

        {/* Newsletter / Trust Strip */}
        <div className="flex flex-col gap-3 border-t border-white/10 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-400">
            Shop with confidence. Quality products, reliable service.
          </p>

          <Link
            href="/products"
            className="group inline-flex w-fit items-center gap-2 text-xs font-semibold text-white transition-colors hover:text-slate-300"
          >
            Explore our collection
            <ArrowUpRight
              size={14}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* Bottom Footer */}
        <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {displayName}. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link
              href="/about"
              className="transition-colors hover:text-white"
            >
              About
            </Link>

            <Link
              href="/products"
              className="transition-colors hover:text-white"
            >
              Shop
            </Link>

            <Link
              href="/contact"
              className="group inline-flex items-center gap-1 transition-colors hover:text-white"
            >
              Contact
              <ArrowUpRight
                size={12}
                className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>

            <CookiePreferencesButton />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: {
    label: string;
    href: string;
  }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-bold tracking-wide text-white">
        {title}
      </h3>

      <ul className="mt-5 space-y-4">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="group inline-flex items-center gap-1 text-sm text-slate-400 transition-colors duration-200 hover:text-white"
            >
              {link.label}
              <ArrowUpRight
                size={12}
                className="opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
