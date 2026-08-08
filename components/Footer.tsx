import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter,
  Github,
  Mail,
  MapPin,
  Phone,
  ArrowUpRight,
} from "lucide-react";

const shopLinks = [
  { label: "All Products", href: "/products" },
  { label: "Electronics", href: "/products?category=Electronics" },
  { label: "Fashion", href: "/products?category=Fashion" },
  { label: "Shoes", href: "/products?category=Shoes" },
];

const supportLinks = [
  { label: "My Account", href: "/user" },
  { label: "My Orders", href: "/user/orders" },
  { label: "Cart", href: "/cart" },
  { label: "Contact Us", href: "/contact" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Return Policy", href: "/return-policy" },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
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
        {/* =========================================
            MAIN FOOTER
        ========================================= */}

        <div
          className="
            grid
            grid-cols-1
            gap-10
            py-12
            sm:grid-cols-2
            lg:grid-cols-5
            lg:gap-8
            lg:py-16
          "
        >
          {/* Brand */}

          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2"
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-white
                  text-sm
                  font-black
                  text-black
                "
              >
                B
              </div>

              <span className="text-xl font-black tracking-tight">
                Bagddash
              </span>
            </Link>

            <p
              className="
                mt-5
                max-w-md
                text-sm
                leading-6
                text-white/50
              "
            >
              Discover quality products, modern style,
              and everyday essentials—all in one place.
              We make online shopping simple and enjoyable.
            </p>

            {/* Contact */}

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-white/60">
                <Mail size={16} />
                <span>support@bagddash.com</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-white/60">
                <Phone size={16} />
                <span>+880 1XXX-XXXXXX</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-white/60">
                <MapPin size={16} />
                <span>Dhaka, Bangladesh</span>
              </div>
            </div>

            {/* Social */}

            <div className="mt-7 flex items-center gap-2">
              <SocialLink
                href="#"
                label="Facebook"
              >
                <Facebook size={17} />
              </SocialLink>

              <SocialLink
                href="#"
                label="Instagram"
              >
                <Instagram size={17} />
              </SocialLink>

              <SocialLink
                href="#"
                label="Twitter"
              >
                <Twitter size={17} />
              </SocialLink>

              <SocialLink
                href="#"
                label="GitHub"
              >
                <Github size={17} />
              </SocialLink>
            </div>
          </div>

          {/* Shop */}

          <FooterColumn
            title="Shop"
            links={shopLinks}
          />

          {/* Support */}

          <FooterColumn
            title="Support"
            links={supportLinks}
          />

          {/* Company */}

          <FooterColumn
            title="Company"
            links={companyLinks}
          />
        </div>

        {/* =========================================
            BOTTOM FOOTER
        ========================================= */}

        <div
          className="
            flex
            flex-col
            gap-4
            border-t
            border-white/10
            py-6
            text-xs
            text-white/40
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <p>
            © {new Date().getFullYear()} Bagddash.
            All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <Link
              href="/privacy"
              className="transition hover:text-white"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="transition hover:text-white"
            >
              Terms
            </Link>

            <Link
              href="/contact"
              className="
                group
                flex
                items-center
                gap-1
                transition
                hover:text-white
              "
            >
              Contact
              <ArrowUpRight
                size={12}
                className="
                  transition-transform
                  group-hover:translate-x-0.5
                  group-hover:-translate-y-0.5
                "
              />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* =========================================
   FOOTER COLUMN
========================================= */

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
      <h3 className="text-sm font-bold text-white">
        {title}
      </h3>

      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="
                text-sm
                text-white/50
                transition
                hover:text-white
              "
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* =========================================
   SOCIAL LINK
========================================= */

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="
        flex
        h-9
        w-9
        items-center
        justify-center
        rounded-full
        border
        border-white/10
        bg-white/5
        text-white/60
        transition
        hover:border-white/20
        hover:bg-white
        hover:text-black
      "
    >
      {children}
    </Link>
  );
}
