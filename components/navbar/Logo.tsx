import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 select-none"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-lg font-bold text-white">
        N
      </div>

      <div className="leading-none">
        <h2 className="text-xl font-black tracking-tight">
          NAKIVO
        </h2>

        <p className="text-[11px] text-muted-foreground">
          Premium Store
        </p>
      </div>
    </Link>
  );
}