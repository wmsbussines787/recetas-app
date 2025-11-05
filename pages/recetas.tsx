import useSWR from "swr";
import Link from "next/link";
import { useMemo, useState } from "react";

type Recipe = {
  slug: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  tags?: any[] | null;
  time_total?: number | null;
};

const fetcher = async (url: string) => {
  const r = await fetch(url);
  // Si la API devolviera HTML por error, evita romper el JSON.parse
  try { return await r.json(); } catch { return null; }
};

// Normaliza a array
function toArray(resp: any): Recipe[] {
  if (!resp) return [];
  const data = resp?.data ?? resp;
  if (Array.isArray(data)) return data as Recipe[];
  if (data && typeof data === "object") return [data as Recipe];
  return [];
}

function toText(v: any) {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v && (v.name || v.title || v.text)) return String(v.name || v.title || v.text);
  return "";
}

export default function RecetasPage() {
  const { data: resp, error, isLoading, mutate } = useSWR("/api/recipes", fetcher, {
    revalidateOnFocus: false,
  });

  const list = useMemo(() => toArray(resp), [resp]);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  async function handleDelete(slug: string) {
    if (!slug) return;
    if (typeof window !== "undefined" && !window.confirm("¿Eliminar esta receta?")) return;

    setDeletingSlug(slug);
    try {
      const res = await fetch(`/api/recipes?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        let message = "No se pudo eliminar la receta.";
        try {
          const body = await res.json();
          if (body?.error) message = String(body.error);
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(message);
      }

      await mutate();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      if (typeof window !== "undefined") {
        window.alert(message);
      }
    } finally {
      setDeletingSlug((current) => (current === slug ? null : current));
    }
  }

  if (error) return <p style={{ padding: 24, color: "#e11d48" }}>Error cargando recetas.</p>;
  if (isLoading) return <p style={{ padding: 24 }}>Cargando…</p>;

  return (
    <div style={{ padding: "24px", maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Recetas</h1>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        Total: {list.length}
      </p>

      {list.length === 0 ? (
        <div style={{ opacity: 0.8 }}>
          No hay recetas. Crea una en <Link href="/new">/new</Link>.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {list.map((r) => {
            const img =
              r.image_url ||
              `https://picsum.photos/seed/${encodeURIComponent(r.slug)}/600/400`;
            const tags = Array.isArray(r.tags) ? r.tags : [];
            const isDeleting = deletingSlug === r.slug;
            return (
              <div
                key={r.slug}
                style={{
                  position: "relative",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "var(--card, #fff)",
                }}
              >
                <Link
                  href={`/r/${encodeURIComponent(r.slug)}`}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <img
                    src={img}
                    alt={toText(r.title)}
                    style={{ width: "100%", aspectRatio: "3/2", objectFit: "cover", display: "block" }}
                  />
                  <div style={{ padding: 12 }}>
                    <div style={{ fontWeight: 700 }}>{toText(r.title)}</div>
                    {r.description && (
                      <div style={{ opacity: 0.8, fontSize: 14, marginTop: 4 }}>
                        {toText(r.description)}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {tags.slice(0, 3).map((t: any, i: number) => (
                        <span
                          key={i}
                          style={{
                            border: "1px solid #d1d5db",
                            borderRadius: 999,
                            padding: "2px 8px",
                            fontSize: 12,
                          }}
                        >
                          #{toText(t)}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                      ⏱ {typeof r.time_total === "number" ? r.time_total : 15} min
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void handleDelete(r.slug);
                  }}
                  disabled={isDeleting}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    border: "none",
                    borderRadius: 999,
                    padding: "6px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    background: isDeleting ? "#d1d5db" : "#ef4444",
                    color: "white",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                    transition: "background 0.2s ease",
                  }}
                >
                  {isDeleting ? "Eliminando…" : "Eliminar"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
