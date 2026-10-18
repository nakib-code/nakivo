
"use client";

import { useState } from "react";
import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PasswordInputProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
}

export default function PasswordInput<T extends FieldValues>({
  control,
  name,
  label = "Password",
  placeholder = "Enter your password",
  disabled = false,
  autoComplete = "current-password",
}: PasswordInputProps<T>) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    field,
    fieldState: { error },
  } = useController({
    control,
    name,
  });

  const inputId = String(name);
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-foreground"
      >
        {label}
      </label>

      <div className="relative">
        <Input
          {...field}
          id={inputId}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className="h-12 pr-14"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}
