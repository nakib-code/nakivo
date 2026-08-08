"use client";

import { useState } from "react";
import { Control, FieldPath, FieldValues, useController } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PasswordInputProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function PasswordInput<T extends FieldValues>({
  control,
  name,
  label = "Password",
  placeholder = "Enter your password",
  disabled = false,
}: PasswordInputProps<T>) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    field,
    fieldState: { error },
  } = useController({
    control,
    name,
  });

  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="text-sm font-medium"
      >
        {label}
      </label>

      <div className="relative">
        <Input
          {...field}
          id={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          autoComplete="current-password"
          disabled={disabled}
          className="pr-20"
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-2 top-1/2 h-8 -translate-y-1/2 px-2"
        >
          {showPassword ? "Hide" : "Show"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}