import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  siteName?: string;
  logoUrl?: string;
}

export default function Logo({
  siteName = "NAKIVO",
  logoUrl = "",
}: LogoProps) {
  const displayName = siteName.trim() || "NAKIVO";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Link
      href="/"
      className="flex items-center gap-2 select-none"
    >
      {logoUrl ? (
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          <Image
            src={logoUrl}
            alt={displayName}
            fill
            sizes="40px"
            className="object-contain"
          />
        </div>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-lg font-bold text-white">
          {initial}
        </div>
      )}

      <div className="leading-none">
        <span className="block text-xl font-black tracking-tight">
          {displayName}
        </span>

        <p className="text-[11px] text-muted-foreground">
          Premium Store
        </p>
      </div>
    </Link>
  );
}