import { useSyncExternalStore } from "react";

const KEY = "fav_slugs_v1";

const EMPTY: string[] = [];

let cache: string[] = EMPTY;
let initialized = false;

const isBrowser = () => typeof window !== "undefined";

function parseValue(raw: unknown): string[] {
  if (!Array.isArray(raw)) return EMPTY;
  const set = new Set<string>();
  for (const value of raw) {
    if (typeof value === "string" && value) {
      set.add(value);
    }
  }
  return set.size ? Array.from(set) : EMPTY;
}

function loadSnapshot() {
  if (!isBrowser()) return;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = parseValue(raw ? JSON.parse(raw) : []);
  } catch {
    cache = EMPTY;
  }
  initialized = true;
}

function getSnapshot() {
  if (!initialized && isBrowser()) {
    loadSnapshot();
  }
  return cache;
}

function setSnapshot(next: Iterable<string>) {
  const set = new Set<string>();
  for (const value of next) {
    if (typeof value === "string" && value) {
      set.add(value);
    }
  }
  cache = set.size ? Array.from(set) : EMPTY;
  initialized = true;
}

function write(next: Iterable<string>) {
  if (!isBrowser()) return;
  setSnapshot(next);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
    const detail = { key: KEY, newValue: JSON.stringify(cache) } as StorageEventInit;
    window.dispatchEvent(new StorageEvent("storage", detail));
  } catch {
    try {
      window.dispatchEvent(new Event("storage"));
    } catch {
      // ignore dispatch errors (older browsers)
    }
  }
}

function subscribe(cb: () => void) {
  if (!isBrowser()) return () => {};
  const handler = (event: Event) => {
    if (event instanceof StorageEvent) {
      if (event.key && event.key !== KEY) return;
      if (typeof event.newValue === "string") {
        try {
          cache = parseValue(JSON.parse(event.newValue));
          initialized = true;
        } catch {
          cache = EMPTY;
          initialized = true;
        }
      } else {
        loadSnapshot();
      }
    } else {
      loadSnapshot();
    }
    cb();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export function useFavorites() {
  const favs = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => EMPTY
  );

  const isFav = (slug?: string) => !!slug && favs.includes(slug);

  const toggleFav = (slug?: string) => {
    if (!slug) return;
    const next = favs.includes(slug)
      ? favs.filter((value) => value !== slug)
      : [...favs, slug];
    write(next);
  };

  return { favs, isFav, toggleFav };
}
