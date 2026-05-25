"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "anthro_email_popup_dismissed";
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export default function EmailPopup() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < COOLDOWN_MS) return;

    const timer = setTimeout(() => {
      setOpen(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = inputRef.current?.value.trim();
    if (!email) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setSubmitted(true);
        setMessage(data.message);
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } else {
        setMessage(data.message || "Something went wrong.");
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="email-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-popup-title"
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      <div className="email-card">
        <button
          className="email-close"
          onClick={handleClose}
          aria-label="Close"
          title="Close"
        >
          ×
        </button>
        <h3 id="email-popup-title">Follow the build</h3>
        <p className="email-desc">
          Get the occasional update on what we are shipping. No spam — just the real timeline.
        </p>

        {submitted ? (
          <div className="email-success">
            <span>✓</span> {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="email-form">
            <input
              ref={inputRef}
              type="email"
              placeholder="you@example.com"
              required
              className="email-input"
            />
            <button type="submit" disabled={loading} className="email-btn">
              {loading ? "…" : "Join"}
            </button>
          </form>
        )}
        {message && !submitted && (
          <p className="email-error" role="alert">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
