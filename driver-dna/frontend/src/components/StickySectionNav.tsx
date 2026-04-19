import { useEffect, useState, type CSSProperties } from "react";

export interface SectionNavItem {
  id: string;
  label: string;
}

interface StickySectionNavProps {
  items: SectionNavItem[];
  accentColor: string;
}

export function StickySectionNav({ items, accentColor }: StickySectionNavProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (sections.length === 0) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveId(visible.target.id);
        }
      },
      { threshold: [0.35, 0.6], rootMargin: "-10% 0px -60% 0px" }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      className="sticky top-3 z-20 mb-6 overflow-x-auto rounded-full border border-white/10 bg-zinc-950/90 px-2 py-1.5 shadow-xl shadow-black/30 backdrop-blur-md"
      style={{ "--accent": accentColor } as CSSProperties}
      aria-label="Driver sections"
    >
      <ul className="flex min-w-max items-center gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="inline-flex rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition"
              style={
                item.id === activeId
                  ? {
                      borderColor: `${accentColor}66`,
                      color: "#fff",
                      backgroundColor: `${accentColor}26`
                    }
                  : {
                      borderColor: "transparent",
                      color: "#a1a1aa"
                    }
              }
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
