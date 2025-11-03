import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";

type Recipe = {
  id?: string | number;
  slug: string;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  tags?: string[];
  servings?: number;
  time_total?: number; // minutos
  nutrition?: { kcal?: number; carbs?: number; protein?: number; fat?: number };
  created_at?: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function RecetasPage() {
  const { data, error, isLoading, mutate } = useSWR<Recipe[]>("/api/recipes", fetcher);
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    (data ?? []).forEach(r => r.tags?.forEach(t => s.add(t)));
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (q.trim()) {
      const qq = q.toLowerCase();
      list = list.filter(r =>
        (r.title || "").toLowerCase().includes(qq) ||
        (r.description || "").toLowerCase().includes(qq) ||
        (r.tags || []).some(t => t.toLowerCase().includes(qq)) ||
        (r.slug || "").toLowerCase().includes(qq)
      );
    }
    if (activeTag) list = list.filter(r => (r.tags || []).includes(activeTag));
    return list;
  }, [data, q, activeTag]);

  const S: React.CSSProperties = { fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto", padding: 24, background: "#0b0b0c", minHeight: "100vh", color: "#e8eaed" };
  const Shell: React.CSSProperties = { maxWidth: 1100, margin: "0 auto" };
  const H1: React.CSSProperties = { fontSize: 32, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 };
  const Sub: React.CSSProperties = { opacity: 0.7, marginBottom: 16 };
  const Row: React.CSSProperties = { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", margin: "12px 0 20px" };
  const Input: React.CSSProperties = { flex: 1, minWidth: 240, padding: "10px 12px", borderRadius: 12, border: "1px solid #2a2a2e", background: "#121214", color: "#e8eaed", outline: "none" };
  const Button: React.CSSProperties = { padding: "10px 14px", borderRadius: 12, border: "1px solid #2a2a2e", background: "#16161a", color: "#e8eaed", textDecoration: "none" };

  const Tag = ({ t }: { t: string }) => (
    <button
      onClick={() => setActiveTag(activeTag === t ? null : t)}
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid " + (activeTag === t ? "#3b82f6" : "#2a2a2e"),
        background: activeTag === t ? "#1d283a" : "#121214",
        color: activeTag === t ? "#cde1ff" : "#e8eaed",
        cursor: "pointer"
      }}
      aria-pressed={activeTag === t}
    >
      #{t}
    </button>
  );

  const Grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 };
  const Card: React.CSSProperties = { border: "1px solid #222328", background: "#111113", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" };
  const Img: React.CSSProperties = { width: "100%", aspectRatio: "16/10", objectFit: "cover", background: "#0f0f10" };
  const Body: React.CSSProperties = { padding: 14, display: "flex", flexDirection: "column", gap: 8 };
  const Title: React.CSSProperties = { fontSize: 18, fontWeight: 700, lineHeight: 1.2 };
  const Meta: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", opacity: 0.8, fontSize: 13 };
  const Chip: React.CSSProperties = { border: "1px solid #2a2a2e", borderRadius: 999, padding: "2px 8px" };

  return (
    <main style={S}>
      <div style={Shell}>
        <header>
          <h1 style={H1}>Recetas</h1>
          <div style={Sub}>Busca, filtra por tags y abre el formulario para crear nuevas.</div>
          <div style={Row}>
            <input
              style={Input}
              placeholder="Buscar por título, descripción, tag o slug…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Link href="/new" style={Button}>➕ Nueva receta</Link>
            <button onClick={() => { setQ(""); setActiveTag(null); mutate(); }} style={Button}>↻ Refrescar</button>
          </div>
          {allTags.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {allTags.map((t) => <Tag key={t} t={t} />)}
              {activeTag && (
                <button onClick={() => setActiveTag(null)} style={{ ...Button, padding: "6px 10px" }}>Quitar filtro</button>
              )}
            </div>
          )}
        </header>

        {isLoading && <p>⏳ Cargando recetas…</p>}
        {error && <p style={{ color: "#ff6b6b" }}>Error cargando recetas.</p>}

        {!isLoading && !error && (
          filtered.length ? (
            <section style={Grid}>
              {filtered.map((r) => (
                <article key={r.slug} style={Card}>
                  <img
                    src={r.image_url || `https://picsum.photos/seed/${encodeURIComponent(r.slug)}/800/500`}
                    alt={r.title}
                    style={Img}
                    loading="lazy"
                  />
                  <div style={Body}>
                    <div style={Title}>{r.title}</div>
                    {r.description && <p style={{ opacity: 0.85, fontSize: 14 }}>{r.description}</p>}
                    <div style={Meta}>
                      {typeof r.time_total === "number" && <span style={Chip}>⏱ {r.time_total} min</span>}
                      {typeof r.servings === "number" && <span style={Chip}>🍽 {r.servings} porciones</span>}
                      {r.nutrition?.kcal !== undefined && <span style={Chip}>🔥 {r.nutrition.kcal} kcal</span>}
                    </div>
                    {r.tags && r.tags.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {r.tags.map((t) => (
                          <span key={t} style={{ ...Chip, opacity: 0.9 }}>#{t}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      {r.video_url && <a href={r.video_url} target="_blank" rel="noreferrer" style={Button}>▶️ Video</a>}
                      <a href={`/api/recipes?slug=${encodeURIComponent(r.slug)}`} target="_blank" rel="noreferrer" style={Button}>JSON</a>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <div style={{ opacity: 0.8, padding: "24px 0" }}>No hay recetas que coincidan. Crea una en <Link href="/new">/new</Link>.</div>
          )
        )}
      </div>
    </main>
  );
}
