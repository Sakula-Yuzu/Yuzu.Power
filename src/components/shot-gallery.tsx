import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { shots } from "@/data/content";

export function ShotGallery() {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (index === null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIndex(null);
      if (event.key === "ArrowRight") setIndex((i) => (i === null ? i : (i + 1) % shots.length));
      if (event.key === "ArrowLeft") {
        setIndex((i) => (i === null ? i : (i - 1 + shots.length) % shots.length));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);

  const open = index !== null ? shots[index] : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {shots.map((shot, i) => (
          <li key={shot.src} className={i === 0 ? "col-span-2 lg:col-span-2" : undefined}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-card text-left"
            >
              <img
                src={shot.src}
                alt={`${shot.title}，Yuzu.Power ${shot.version} 的应用截图`}
                loading="lazy"
                decoding="async"
                className="aspect-3/4 w-full object-cover object-top"
              />
              <span className="flex flex-1 flex-col gap-1 p-3">
                <span className="text-xs text-muted">{shot.version}</span>
                <span className="font-medium text-ink">{shot.title}</span>
                <span className="text-sm text-muted">{shot.caption}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {open && index !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={open.title}
          onClick={() => setIndex(null)}
        >
          <div
            className="flex max-h-full w-full max-w-sm flex-col gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between text-paper">
              <p className="text-sm">
                {open.title} · {open.version}
              </p>
              <button
                type="button"
                onClick={() => setIndex(null)}
                className="inline-flex size-11 items-center justify-center rounded-full bg-paper text-ink"
              >
                <X className="size-5" aria-hidden />
                <span className="sr-only">关闭</span>
              </button>
            </div>
            <img
              src={open.src}
              alt=""
              className="max-h-[70vh] w-full rounded-2xl object-contain"
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="min-h-11 flex-1 rounded-full bg-paper text-sm font-medium text-ink"
                onClick={() => setIndex((index - 1 + shots.length) % shots.length)}
              >
                上一张
              </button>
              <button
                type="button"
                className="min-h-11 flex-1 rounded-full bg-paper text-sm font-medium text-ink"
                onClick={() => setIndex((index + 1) % shots.length)}
              >
                下一张
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
