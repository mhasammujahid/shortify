"use client";

import { useState, useEffect, useRef } from "react";

interface LinkItem {
  id: string;
  slug: string;
  url: string;
  shortUrl: string;
  clicks: number;
  createdAt: string;
}

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LinkItem | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();

    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "not_found") {
      setError("Short link not found.");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          customSlug: customSlug.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setResult(data);
        setUrl("");
        setCustomSlug("");
        setShowAdvanced(false);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Grid background */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--text) 1px, transparent 1px), linear-gradient(90deg, var(--text) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Accent glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(232,255,71,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <header className="mb-14 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-sm flex items-center justify-center text-black text-sm font-bold"
              style={{ background: "var(--accent)" }}
            >
              S
            </div>
            <span
              className="text-xs tracking-[0.25em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              shortify
            </span>
          </div>
          <h1
            className="text-5xl font-extrabold tracking-tight leading-none mb-3"
            style={{ fontFamily: "var(--font-sans)", color: "var(--text)" }}
          >
            Shorten.
            <br />
            <span style={{ color: "var(--accent)" }}>Share.</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Clean URLs. No noise. Powered by Neon + Next.js.
          </p>
        </header>

        {/* Form card */}
        <div
          className="rounded-xl p-6 mb-4 animate-slide-up"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-long-url.com/goes/here"
                required
                className="flex-1 rounded-lg px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  fontFamily: "var(--font-mono)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                  e.target.style.boxShadow = "0 0 0 2px var(--accent-dim)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="px-5 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background:
                    loading || !url.trim()
                      ? "var(--surface-2)"
                      : "var(--accent)",
                  color: loading || !url.trim() ? "var(--text-muted)" : "#000",
                  border: "1px solid transparent",
                  minWidth: "80px",
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    Wait
                  </span>
                ) : (
                  "shortify"
                )}
              </button>
            </div>

            {/* Advanced toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs transition-colors"
              style={{
                color: showAdvanced ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {showAdvanced ? "↑ Hide" : "+ Custom slug"}
            </button>

            {showAdvanced && (
              <div
                className="flex items-center gap-0 rounded-lg overflow-hidden animate-fade-in"
                style={{ border: "1px solid var(--border)" }}
              >
                <span
                  className="px-3 py-2.5 text-xs select-none"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--text-muted)",
                    borderRight: "1px solid var(--border)",
                    fontFamily: "var(--font-mono)",
                    whiteSpace: "nowrap",
                  }}
                >
                  shortify.app/r/
                </span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder="my-custom-slug"
                  className="flex-1 px-3 py-2.5 text-sm outline-none"
                  style={{
                    background: "var(--surface-2)",
                    color: "var(--text)",
                    fontFamily: "var(--font-mono)",
                  }}
                />
              </div>
            )}
          </form>
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-lg px-4 py-3 mb-4 text-sm animate-fade-in flex items-center gap-2"
            style={{
              background: "rgba(255,80,80,0.08)",
              border: "1px solid rgba(255,80,80,0.2)",
              color: "#ff8080",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Success result */}
        {result && (
          <div
            className="rounded-xl p-5 mb-8 animate-slide-up"
            style={{
              background: "rgba(232,255,71,0.05)",
              border: "1px solid rgba(232,255,71,0.2)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs mb-1.5"
                  style={{
                    color: "var(--accent)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  ✓ link created
                </p>
                <p
                  className="font-semibold text-lg break-all"
                  style={{
                    color: "var(--accent)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {result.shortUrl}
                </p>
                <p
                  className="text-xs mt-1 truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  → {truncate(result.url, 60)}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(result.shortUrl)}
                className="shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: copied ? "var(--accent)" : "var(--accent-dim)",
                  color: copied ? "#000" : "var(--accent)",
                  border: "1px solid rgba(232,255,71,0.3)",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer
          className="mt-16 pt-8"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Built with Next.js · Prisma · Neon · Docker
            </p>
            <a
              href="/api/health"
              target="_blank"
              rel="noopener"
              className="text-xs flex items-center gap-1.5 transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--accent)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse-slow"
                style={{ background: "#4ade80", display: "inline-block" }}
              />
              health
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
