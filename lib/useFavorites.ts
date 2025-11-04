import { useSyncExternalStore } from "react";

const KEY = "fav_slugs_v1";

function safeWindow() {
  return typeof window !== "undefined";
}

function read(): string[] {
  if (!safeWindow()) return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") } catch { return [] }
}

function write(next: string[]) {
  if (!safeWindow()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
  } catch {}
}

function subscribe(cb: () => void) {
  if (!safeWindow()) return () => {};
  const f = () => cb();
  window.addEventListener("storage", f);
  return () => window.removeEventListener("storage", f);
}

export function useFavorites() {
  const favs = useSyncExternalStore(
    subscribe,
    read,
    () => [] // snapshot en SSR
  );
  const isFav = (slug?: string) => !!slug && favs.includes(slug);
  const toggleFav = (slug?: string) => {
    if (!slug) return;
    const set = new Set(read());
    set.has(slug) ? set.delete(slug) : set.add(slug);
    write(Array.from(set));
  };
  return { favs, isFav, toggleFav };
}
