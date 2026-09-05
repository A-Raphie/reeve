"use client";

// Scroll choreography (landing B7 + B11): word-by-word tagline activation and
// viewport-entry reveals, IntersectionObserver only (never scroll listeners).
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function TaglineReveal({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = Array.from(el.querySelectorAll<HTMLElement>(".reveal-word"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = words.indexOf(entry.target as HTMLElement);
          setTimeout(() => entry.target.classList.add("active"), idx * 90);
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.6 },
    );
    words.forEach((w) => io.observe(w));
    return () => io.disconnect();
  }, [text]);
  return (
    <h2 ref={ref} className={className}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="reveal-word">
          {word}
          {i < text.split(" ").length - 1 ? " " : ""}
        </span>
      ))}
    </h2>
  );
}

export function ScrollReveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.remove("opacity-0", "translate-y-16", "blur-md");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] opacity-0 translate-y-16 blur-md ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
