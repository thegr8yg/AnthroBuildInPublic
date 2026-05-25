"use client";

import { useRef, useState, useEffect } from "react";

export default function BoardCarousel<T extends { id: string; label: string; note: string }>({
  buckets,
  renderBucket,
}: {
  buckets: T[];
  renderBucket: (bucket: T, index: number) => React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const scrollLeft = el.scrollLeft;
      const width = el.offsetWidth;
      const idx = Math.round(scrollLeft / width);
      setActive(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  function goTo(index: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.offsetWidth, behavior: "smooth" });
  }

  return (
    <div className="board-carousel">
      <div className="board-scroll" ref={scrollRef}>
        {buckets.map((b, i) => (
          <div key={b.id} className="board-slide">
            {renderBucket(b, i)}
          </div>
        ))}
      </div>
      <div className="board-dots">
        {buckets.map((_, i) => (
          <button
            key={i}
            className={`board-dot${i === active ? " active" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Go to ${buckets[i]?.label}`}
          />
        ))}
      </div>
    </div>
  );
}
