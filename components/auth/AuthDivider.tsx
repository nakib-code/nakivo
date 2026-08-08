interface AuthDividerProps {
  text?: string;
}

export default function AuthDivider({
  text = "or continue with email",
}: AuthDividerProps) {
  return (
    <div className="relative flex items-center justify-center">
      <div className="w-full border-t border-gray-200" />

      <span className="absolute bg-white px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {text}
      </span>
    </div>
  );
}