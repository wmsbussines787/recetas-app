import { useState, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";
import { useFavorites } from "../lib/useFavorites";

type Recipe = {
  id: string | number;
  slug: string;
  title: string;
  image_url?: string;
  tags?: string[];
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function RecetasPage() {
  const { data, error, isLoading } = useSWR<Recipe[]>("/api/recipes", fetcher);
  const { isFav, toggleFav } = useFavorites();

  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const t = new Set<string>();
    data?.forEach((r) => r.tags?.forEach((x) => t.add(x)));
    return [...t];
  }, [data]);

  const list = useMemo(() => {
    if (!data) return [];
    return data.filter((r) => {
      const s = search.toLowerCase();
      const matchSearch =
        !s ||
        r.title.toLowerCase().includes(s) ||
        (r.tags || []).some((x) => x.toLowerCase().includes(s));
      const matchTag = !activeTag || r.tags?.includes(activeTag);
      return matchSearch && matchTag;
    });
  }, [data, search, activeTag]);

  return (
    <>
      <style jsx global>{`
        .card { position: relative; }
        .favBtn {
          position: absolute; top: 8px; right: 8px;
          width: 36px; height: 36px; border-radius: 999px;
          display: grid; place-items: center; font-size: 18px;
          border: 1px solid var(--border); background: rgba(0,0,0,.55);
          color: #fff; cursor: pointer;
        }
        @media (prefers-color-scheme: light){
          .favBtn { background: rgba(255,255,255,.7); color: #111; }
        }
      `}</style>

      <h1 className="h1">Recetas</h1>
      <p className="sub">Explora, busca o crea nuevas recetas</p>

      <input
        placeholder="Buscar receta..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--card)",
          color: "var(--fg)",
          marginBottom: 14,
        }}
      />

      {/* TAGS */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {allTags.map((tag) => {
          const active = activeTag === tag;
          return (
            <button
              key={tag}
              onClick={() => setActiveTag(active ? null : tag)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                background: active ? "var(--accent)" : "var(--chip)",
                color: active ? "#fff" : "var(--fg)",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              #{tag}
            </button>
          );
        })}
      </div>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 18,
        }}
      >
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 180,
                borderRadius: 14,
                background: "var(--card)",
                opacity: 0.3,
              }}
            />
          ))}

        {list.map((r) => {
          const fav = isFav(r.slug);
          return (
            <motion.div
              key={r.id ?? r.slug}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
              className="card"
              style={{
                borderRadius: 14,
                overflow: "hidden",
                background: "var(--card)",
                boxShadow: "var(--shadow)",
              }}
            >
              <Link href={`/r/${encodeURIComponent(r.slug)}`} style={{ display: "block" }}>
                <img
                  src={
                    r.image_url ||
                    `https://picsum.photos/seed/${encodeURIComponent(r.slug)}/400/300`
                  }
                  alt={r.title}
                  style={{ width: "100%", height: 180, objectFit: "cover" }}
                />
                <div style={{ padding: 14, fontWeight: 600 }}>{r.title}</div>
              </Link>

              {/* ⭐ botón toggle favoritos */}
              <button
                className="favBtn"
                aria-pressed={fav}
                title={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
                onClick={(e) => {
                  e.preventDefault(); // evita navegar
                  toggleFav(r.slug);
                }}
              >
                {fav ? "⭐" : "☆"}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {!isLoading && list.length === 0 && (
        <p style={{ opacity: 0.6, textAlign: "center", marginTop: 40 }}>
          No hay recetas que coincidan.
        </p>
      )}

      {/* FAB Nueva */}
      <Link
        href="/new"
        style={{
          position: "fixed",
          bottom: 100,
          right: 22,
          background: "var(--accent)",
          color: "#fff",
          padding: "16px 20px",
          borderRadius: "999px",
          fontSize: 26,
          boxShadow: "var(--shadow)",
        }}
      >
        +
      </Link>
    </>
  );
}
