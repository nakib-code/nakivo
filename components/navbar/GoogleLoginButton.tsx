"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function GoogleLoginButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => signIn("google")}
    >
      {/* Google Icon */}
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="#4285F4"
          d="M21.35 12.23c0-.79-.07-1.55-.2-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.92-4.18 2.92-7.39Z"
        />
        <path
          fill="#34A853"
          d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.5A9.75 9.75 0 0 0 12 21.5Z"
        />
        <path
          fill="#FBBC05"
          d="M6.54 13.61A5.86 5.86 0 0 1 6.23 12c0-.56.1-1.1.31-1.61v-2.5H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.39l3.24-2.78Z"
        />
        <path
          fill="#EA4335"
          d="M12 6.36c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.34 14.63 2.5 12 2.5A9.75 9.75 0 0 0 3.3 7.89l3.24 2.5 3.24 2.5C7.31 8.08 9.46 6.36 12 6.36Z"
        />
      </svg>

      Google
    </Button>
  );
}