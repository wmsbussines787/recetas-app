import { useState, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion } from "framer-motion";

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

      {/* TAG FILTERS */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            style={{
              padding: "6px 12px",
              borderRadius: 20,
              background: activeTag === tag ? "var(--accent)" : "var(--chip)",
              color: activeTag === tag ? "#fff" : "var(--fg)",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* LIST GRID */}
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

        {list.map((r) => (
          <motion.div
            key={r.id}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
            style={{
              borderRadius: 14,
              overflow: "hidden",
              background: "var(--card)",
              boxShadow: "var(--shadow)",
            }}
          >
            <Link href={`/r/${encodeURIComponent(r.slug)}`}>
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
          </motion.div>
        ))}
      </div>

      {/* EMPTY STATE */}
      {!isLoading && list.length === 0 && (
        <p style={{ opacity: 0.6, textAlign: "center", marginTop: 40 }}>
          No hay recetas que coincidan.
        </p>
      )}

      {/* FLOATING NEW BUTTON */}
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
