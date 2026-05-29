"use client";

import { useEffect, useState } from "react";

type Props = {
  expiresAt: string;
  className?: string;
};

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Expired — search again";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min >= 60) {
    const hr = Math.floor(min / 60);
    const m = min % 60;
    return `Price held ~${hr}h ${m}m`;
  }
  return `Price held ~${min}m ${sec}s`;
}

export function OfferExpiryCountdown({ expiresAt, className = "text-xs text-amber-800" }: Props) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const expires = new Date(expiresAt).getTime();
    if (Number.isNaN(expires)) return;

    const tick = () => {
      setLabel(formatRemaining(expires - Date.now()));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  if (!label) return null;
  return <p className={className}>{label}</p>;
}
