// pages/r/[slug].tsx
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Recipe = {
  slug: string;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  tags?: string[];
  servings?: number;
  time_total?: number;
  nutrition?: { kcal?: number; carbs?: number; protein?: number; fat?: number };
  ingredients?: string[];
  steps?: string[];
  created_at?: string;
};

export default function RecipeTikTokPage() {
  const router = useRouter();
  const { slug } = router.query as { slug?: string };
  const [data, setData] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        // Nota: /api/recipes devuelve lista completa; filtramos por slug aquí.
        const res = await fetch("/api/recipes");
        const list: Recipe[] = await res.json();
        const found = list.find((r) => r.slug === slug) || null;
        if (!cancelled) setData(found);
      } catch (e: any) {
        if (!cancelled) setErr(e.message || "Error cargando receta");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const waText = useMemo(() => {
    const title = data?.title ?? "Receta";
    const url = shareUrl || "";
    const desc = data?.description ? ` - ${data.description}` : "";
    return encodeURIComponent(`${title}${desc} ${url}`);
  }, [data, shareUrl]);

  const hasVideo = !!data?.video_url;
  const mediaSrc =
    (data?.video_url && data.video_url) ||
    (data?.image_url && data.image_url) ||
    `https://picsum.photos/seed/${encodeURIComponent(slug || "receta")}/900/1600`;

  // Estilos: auto claro/oscuro con prefers-color-scheme
  const css = `
    :root{
      --bg:#0b0b0c; --fg:#e8eaed; --muted:#9aa0a6; --card:#111113; --border:#222328; --chip:#2a2a2e; --accent:#3b82f6;
    }
    @media (prefers-color-scheme: light) {
      :root{
        --bg:#fafafa; --fg:#111; --muted:#555; --card:#fff; --border:#e5e7eb; --chip:#e5e7eb; --accent:#2563eb;
      }
    }
    body { background: var(--bg); color: var(--fg); }
    .wrap{ max-width: 720px; margin: 0 auto; padding-bottom: 96px; }
    .mediaBox{ position: relative; width: 100%; aspect-ratio: 9/16; background: #000; overflow: hidden; border-bottom: 1px solid var(--border); }
    .mediaBox video, .mediaBox img{ width:100%; height:100%; object-fit:cover; display:block; }
    .info{ padding: 16px; }
    .title{ font-size: 22px; font-weight: 800; line-height:1.2; letter-spacing:-0.2px; }
    .desc{ margin-top: 6px; color: var(--muted); }
    .meta{ display:flex; gap:10px; flex-wrap:wrap; margin-top:10px; }
    .chip{ border:1px solid var(--chip); border-radius:999px; padding:4px 10px; font-size:13px; }
    .tags{ display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
    .rowLabel{ font-weight:700; margin:14px 0 8px; }
    .scrollX{ display:flex; gap:10px; overflow:auto; padding-bottom: 6px; }
    .ing{ min-width: 200px; border:1px solid var(--border); background: var(--card); border-radius:12px; padding:10px; }
    .steps{ display:flex; flex-direction:column; gap:10px; }
    .step{ border:1px solid var(--border); background: var(--card); border-radius:12px; padding:12px; display:flex; gap:12px; align-items:flex-start; }
    .stepNo{ min-width:28px; height:28px; border-radius:999px; display:inline-grid; place-items:center; background: var(--accent); color:#fff; font-weight:800; }
    .floatBtns{ position: fixed; right: 16px; bottom: 16px; display:flex; flex-direction:column; gap:10px; z-index:30; }
    .btn{ padding: 10px 14px; border-radius: 999px; border:1px solid var(--chip); background: var(--card); color: var(--fg); text-decoration:none; box-shadow: 0 6px 20px rgba(0,0,0,.25); }
    .btnAccent{ background: var(--accent); color:#fff; border-color: var(--accent); }
    .muted{ color: var(--muted); }
    .topbar{ position: sticky; top: 0; z-index: 20; background: var(--bg); border-bottom: 1px solid var(--border); padding: 10px 12px; display:flex; align-items:center; gap:10px; }
    .back{ text-decoration:none; border:1px solid var(--chip); padding:8px 10px; border-radius:10px; }
  `;

  return (
    <>
      <style jsx global>{css}</style>
      <main className="wrap">
        <div className="topbar">
          <Link href="/recetas" className="back">← Volver</Link>
          <span className="muted">/r/{slug}</span>
        </div>

        {loading && <div className="info">⏳ Cargando…</div>}
        {err && <div className="info" style={{color:"#ff6b6b"}}>Error: {err}</div>}
        {!loading && !err && !data && (
          <div className="info">No se encontró la receta.</div>
        )}

        {!loading && !err && data && (
          <>
            <section className="mediaBox">
              {hasVideo ? (
                <video
                  src={mediaSrc}
                  controls
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img src={mediaSrc} alt={data.title} />
              )}
            </section>

            <section className="info">
              <h1 className="title">{data.title}</h1>
              {data.description && <p className="desc">{data.description}</p>}

              <div className="meta">
                {typeof data.time_total === "number" && <span className="chip">⏱ {data.time_total} min</span>}
                {typeof data.servings === "number" && <span className="chip">🍽 {data.servings} porciones</span>}
                {data.nutrition?.kcal !== undefined && <span className="chip">🔥 {data.nutrition.kcal} kcal</span>}
              </div>

              {data.tags && data.tags.length > 0 && (
                <div className="tags">
                  {data.tags.map((t) => <span key={t} className="chip">#{t}</span>)}
                </div>
              )}

              {data.ingredients && data.ingredients.length > 0 && (
                <>
                  <div className="rowLabel">🧾 Ingredientes</div>
                  <div className="scrollX">
                    {data.ingredients.map((ing, i) => (
                      <div key={i} className="ing">{ing}</div>
                    ))}
                  </div>
                </>
              )}

              {data.steps && data.steps.length > 0 && (
                <>
                  <div className="rowLabel">👣 Pasos</div>
                  <div className="steps">
                    {data.steps.map((txt, i) => (
                      <div key={i} className="step">
                        <div className="stepNo">{i + 1}</div>
                        <div>{txt}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            <div className="floatBtns">
              <a
                className="btn btnAccent"
                href={`https://wa.me/?text=${waText}`}
                target="_blank"
                rel="noreferrer"
              >
                Compartir WhatsApp
              </a>
              <a
                className="btn"
                href={`/api/recipes?slug=${encodeURIComponent(data.slug)}`}
                target="_blank"
                rel="noreferrer"
              >
                Ver JSON
              </a>
            </div>
          </>
        )}
      </main>
    </>
  );
}
