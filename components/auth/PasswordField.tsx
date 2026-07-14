"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
};

export function PasswordField({ id, label, value, onChange, autoComplete, placeholder }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label htmlFor={id} className="form-label">
      {label}
      <span className="relative block">
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full form-control pr-12"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-subtle hover:bg-surface-secondary hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );
}
