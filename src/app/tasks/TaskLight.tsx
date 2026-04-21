"use client";

import { useEffect, useMemo, useState } from "react";

type BucketId = "side" | "todo" | "urgent" | "progress" | "complete";

type Bucket = { id: BucketId; label: string; note: string };

type Task = {
  id: string;
  t: string;
  bucket: BucketId;
  whoName: string;
  whoInitials: string;
  age: string;
  lastEdited: string;
  createdAt: string;
};

type ApiResponse = {
  tasks: Task[];
  configured?: boolean;
  error?: string;
};

const MAIN_BUCKETS: Bucket[] = [
  { id: "todo", label: "On deck", note: "queued" },
  { id: "urgent", label: "On fire", note: "this week" },
  { id: "progress", label: "Cooking", note: "being built" },
  { id: "complete", label: "Shipped", note: "out the door" },
];

const SIDE_BUCKET: Bucket = { id: "side", label: "Daydream", note: "parking lot" };

const BUCKET_LABEL: Record<BucketId, string> = {
  side: "Daydream",
  todo: "On deck",
  urgent: "On fire",
  progress: "Cooking",
  complete: "Shipped",
};

function verbFor(bucket: BucketId): string {
  switch (bucket) {
    case "complete": return "completed";
    case "progress": return "moved";
    case "urgent": return "flagged";
    case "todo": return "queued";
    case "side": return "parked";
  }
}

function syncAgoLabel(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(1, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h`;
}

export default function TaskLight() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [tickIdx, setTickIdx] = useState(0);
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/tasks", { cache: "no-store" });
        const data: ApiResponse = await res.json();
        if (cancelled) return;
        setTasks(Array.isArray(data.tasks) ? data.tasks : []);
        setConfigured(data.configured ?? false);
        setErrorMsg(data.error ?? null);
        setLastSync(new Date().toISOString());
        setLoaded(true);
      } catch (e) {
        if (cancelled) return;
        setTasks([]);
        setConfigured(false);
        setErrorMsg(e instanceof Error ? e.message : "network error");
        setLoaded(true);
      }
    }
    load();
    const poll = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    setYear(new Date().getFullYear());
    const id = setInterval(() => setTickIdx((i) => i + 1), 4200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    let targetX = 12;
    let targetY = 0;
    let curX = 12;
    let curY = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const px = e.clientX / window.innerWidth;
      const py = e.clientY / window.innerHeight;
      targetX = 6 + px * 14;
      targetY = -2 + py * 16;
    };

    const tick = () => {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;
      root.style.setProperty("--aurora-x", `${curX.toFixed(2)}%`);
      root.style.setProperty("--aurora-y", `${curY.toFixed(2)}%`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const recent = useMemo(() => {
    return [...tasks]
      .sort(
        (a, b) => new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime(),
      )
      .slice(0, 5);
  }, [tasks]);

  const tick = recent.length > 0 ? recent[tickIdx % recent.length] : null;

  return (
    <>
      <div className="aurora" aria-hidden />
      <div className="page">
        <header className="top">
          <div className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/anthrolytic-wordmark.png" alt="Anthrolytic" />
          </div>
          <div className="live">
            <span className="dot"></span>
            <span>Live · Synced {syncAgoLabel(lastSync)} ago</span>
          </div>
        </header>

        {loaded && configured === false && (
          <div
            style={{
              margin: "8px 0 0",
              padding: "12px 14px",
              border: "1px solid var(--line)",
              borderLeft: "3px solid var(--purple)",
              borderRadius: 10,
              fontSize: 13,
              color: "var(--ink-2)",
              background: "var(--purple-50)",
            }}
          >
            Notion connection not configured. Set <code>NOTION_TOKEN</code> and{" "}
            <code>NOTION_DATABASE_ID</code> in <code>.env.local</code>, then restart.
          </div>
        )}
        {loaded && configured && errorMsg && (
          <div
            style={{
              margin: "8px 0 0",
              padding: "12px 14px",
              border: "1px solid var(--line)",
              borderLeft: "3px solid #d4a017",
              borderRadius: 10,
              fontSize: 13,
              color: "var(--ink-2)",
              background: "#fffbea",
            }}
          >
            Notion error — {errorMsg}
          </div>
        )}

        <div className="board-head">
          <h1>To do</h1>
        </div>

        <div className="board">
          {MAIN_BUCKETS.map((b) => {
            const items = tasks.filter((t) => t.bucket === b.id);
            const fill = tasks.length === 0 ? 0 : Math.min(90, 12 + items.length * 9);
            return (
              <div key={b.id} className="col" data-bucket={b.id}>
                <div className="col-head">
                  <div className="col-title">
                    <span className="col-swatch"></span>
                    {b.label}
                  </div>
                  <span className="chip">{items.length}</span>
                </div>
                <div
                  className="bucket"
                  data-bucket={b.id}
                  style={{ ["--fill" as string]: `${fill}%` } as React.CSSProperties}
                >
                  {items.map((t) => (
                    <div key={t.id} className="task">
                      <div className="check"></div>
                      <div className="t-title">{t.t}</div>
                      {b.id === "progress" && (
                        <div className="t-bar">
                          <i></i>
                        </div>
                      )}
                      <div className="t-meta">
                        <span className="who">
                          <span className="avatar">{t.whoInitials}</span>
                          {t.whoName}
                        </span>
                        <span>{t.age}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <section className="cta-wrap">
          <a className="cta" href="https://anthrolytic.co">
            Learn more <span className="cta-arrow" aria-hidden>»</span>{" "}
            <span className="cta-url">anthrolytic.co</span>
          </a>
        </section>

        <section className="daydream">
          <div className="daydream-head">
            <h3>{SIDE_BUCKET.label}</h3>
            <span className="daydream-note">{SIDE_BUCKET.note}</span>
          </div>
          <div className="daydream-list">
            {tasks.filter((t) => t.bucket === "side").length === 0 ? (
              <span className="daydream-empty">Nothing parked.</span>
            ) : (
              tasks
                .filter((t) => t.bucket === "side")
                .map((t) => (
                  <span key={t.id} className="daydream-chip">
                    {t.t}
                  </span>
                ))
            )}
          </div>
        </section>

        <footer className="bot">
          <div>
            © Anthrolytic · <span>{year ?? ""}</span> ·{" "}
            <a className="site" href="https://anthrolytic.co">
              anthrolytic.co
            </a>
          </div>
          <div className="socials">
            <a
              className="ic"
              href="https://instagram.com/anthrolytic"
              aria-label="Instagram"
              title="Instagram"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a className="ic" href="https://x.com/anthrolytic" aria-label="X" title="X">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              className="ic"
              href="https://linkedin.com/company/anthrolytic"
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M4.98 3.5A2.5 2.5 0 1 1 2.48 6 2.5 2.5 0 0 1 4.98 3.5zM3 8.98h4V21H3zM9 8.98h3.84v1.64h.05a4.2 4.2 0 0 1 3.79-2.08c4.05 0 4.8 2.66 4.8 6.13V21h-4v-5.3c0-1.27-.03-2.9-1.77-2.9s-2.04 1.38-2.04 2.81V21H9z" />
              </svg>
            </a>
            <a
              className="ic"
              href="https://tiktok.com/@anthrolytic"
              aria-label="TikTok"
              title="TikTok"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 2h-2.8v13.1a2.9 2.9 0 1 1-2.9-2.9c.28 0 .54.04.8.12V9.47a6 6 0 1 0 5 5.92V8.2a7.3 7.3 0 0 0 4.3 1.39V6.73A4.42 4.42 0 0 1 16.5 2z" />
              </svg>
            </a>
          </div>
        </footer>
      </div>

      {tick && (
        <div className="ticker">
          <span className="dot"></span>
          <span>
            <b>{tick.whoName}</b> {verbFor(tick.bucket)}{" "}
            <b>&ldquo;{tick.t}&rdquo;</b> → {BUCKET_LABEL[tick.bucket]}{" "}
            <span className="ag">{tick.age} ago</span>
          </span>
        </div>
      )}
    </>
  );
}
