import { useState } from "react";
import { Menu, X } from "lucide-react";
import { latest, nav } from "@/data/content";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="font-display text-xl tracking-tight text-ink">
          Yuzu.Power
        </a>
        <nav className="hidden items-center gap-6 md:flex" aria-label="页内">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-muted hover:text-ink">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={latest.downloadUrl}
            className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-sm font-medium text-on-accent transition-colors duration-200 hover:bg-ink hover:text-paper"
          >
            下载 {latest.version}
          </a>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-card text-ink md:hidden"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            <span className="sr-only">{open ? "关闭菜单" : "打开菜单"}</span>
          </button>
        </div>
      </div>
      {open ? (
        <nav
          id="site-menu"
          className="border-t border-line bg-card px-4 py-3 md:hidden"
          aria-label="页内"
        >
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex min-h-11 items-center text-base text-ink"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
