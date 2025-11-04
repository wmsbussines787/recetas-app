import { useEffect, useSyncExternalStore } from "react";

const KEY = "fav_slugs_v1";

function read(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") } catch { return [] }
}
function write(next: string[]) {
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

function subscribe(cb: () => void) {
  const f = () => cb();
  window.addEventListener("storage", f);
  return () => window.removeEventListener("storage", f);
}

export function useFavorites() {
  const favs = useSyncExternalStore(
    subscribe,
    read,
    () => [] // SSR fallback
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
