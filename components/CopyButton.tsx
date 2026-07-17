"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return <button type="button" className="btn-ghost min-h-8 px-2 py-1 text-xs" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}<span className="sr-only">{copied ? "Copied" : label}</span></button>;
}
