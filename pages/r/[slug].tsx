import { useRouter } from "next/router";
import useSWR from "swr";
import { motion } from "framer-motion";
import Link from "next/link";

type Recipe = {
  id?: string | number;
  slug: string;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  ingredients?: string[];
  steps?: string[];
  tags?: string[];
  time_total?: number;
  servings?: number;
  nutrition?: { kcal?: number; carbs?: number; protein?: number; fat?: number };
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Normaliza respuesta: si API devuelve array, toma la receta por slug
function normalizeRecipe(resp: any, slug: string | string[] | undefined): Recipe | null {
  if (!resp) return null;
  if (Array.isArray(resp)) {
    const s = Array.isArray(slug) ? slug[0] : slug;
    return resp.find((r) => r?.slug === s) ?? null;
  }
  // si es objeto único, lo regresamos tal cual
  return resp as Recipe;
}

export default function RecipeDetail() {
  const router = useRouter();
  const { slug } = router.query;

  // Intento directo por ?slug; si aún no hay slug, evita fetch
  const { data: resp, isLoading, error } = useSWR(
    slug ? `/api/recipes?slug=${encodeURIComponent(String(slug))}` : null,
    fetcher
  );

  const recipe: Recipe | null = normalizeRecipe(resp, slug);

  // Estilos locales (incluye FAB)
  const css = `
    .hero { width: 100%; border-radius: 16px; overflow: hidden; background: var(--card); margin-bottom: 20px; }
    .meta { display: flex; gap: 10px; flex-wrap: wrap; margin: 10px 0 18px; }
    .chip { border: 1px solid var(--chip); border-radius: 999px; padding: 4px 10px; font-size: 13px; }
    .btnRow { display: flex; gap: 10px; margin-top: 20px; }
    .btn { flex: 1; padding: 12px; border-radius: 12px; text-align: center; text-decoration: none; cursor: pointer; border: 1px solid var(--chip); background: var(--card); color: var(--fg); }
    .btnAccent { background: var(--accent); color: #fff; border-color: var(--accent); }
    .tags { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0 16px; }
    .sectionTitle { margin-top: 24px; margin-bottom: 8px; font-weight: 800; }
    .fabWrap { position: fixed; right: 18px; bottom: 96px; z-index: 40; }
    .fab {
      width: 56px; height: 56px; border-radius: 999px; display: grid; place-items: center;
      background: rgba(0,0,0,0.85); color: #fff; border: 2px solid #fff; box-shadow: 0 12px 30px rgba(0,0,0,.35);
      cursor: pointer; user-select: none;
    }
    @media (min-width: 1000px) { .fab { width: 64px; height: 64px; } }
    .fab:hover { filter: brightness(1.05); transform: translateY(-1px); transition: transform .15s ease; }
  `;

  if (isLoading) return <p>Cargando receta…</p>;
  if (error) return <p style={{ color: "#ff6b6b" }}>Error: {String(error)}</p>;
  if (!recipe) return <p>No encontrada.</p>;

  const hasSteps = Array.isArray(recipe.steps) && recipe.steps.length > 0;
  const mediaSrc =
    recipe.video_url ||
    recipe.image_url ||
    `https://picsum.photos/seed/${encodeURIComponent(recipe.slug)}/900/600`;

  const goToCooking = () => router.push(`/cocina/${recipe.slug}`);

  return (
    <>
      <style jsx global>{css}</style>

      {/* HERO: video o imagen */}
      <motion.div
        className="hero"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {recipe.video_url ? (
          <video
            src={mediaSrc}
            controls
            playsInline
            style={{ width: "100%", maxHeight: 460, objectFit: "cover" }}
          />
        ) : (
          <img
            src={mediaSrc}
            alt={recipe.title}
            style={{ width: "100%", maxHeight: 460, objectFit: "cover", display: "block" }}
          />
        )}
      </motion.div>

      {/* Título + meta */}
      <h1 className="h1">{recipe.title}</h1>
      <p className="sub">
        ⏱ {typeof recipe.time_total === "number" ? recipe.time_total : 15} min · 🍽{" "}
        {typeof recipe.servings === "number" ? recipe.servings : 1} porciones
      </p>

      {/* Botón normal Modo Cocina */}
      <button onClick={goToCooking} className="btn btnAccent" style={{ width: "100%", marginTop: 12 }}>
        ��‍🍳 Modo Cocina
      </button>

      {/* Tags */}
      {recipe.tags && recipe.tags.length > 0 && (
        <div className="tags">
          {recipe.tags.map((t) => (
            <span key={t} className="chip">#{t}</span>
          ))}
        </div>
      )}

      {/* Descripción */}
      {recipe.description && <p className="sub" style={{ marginTop: 8 }}>{recipe.description}</p>}

      {/* Ingredientes */}
      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <>
          <h3 className="sectionTitle">🛒 Ingredientes</h3>
          <ul style={{ lineHeight: 1.7 }}>
            {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
          </ul>
        </>
      )}

      {/* Pasos */}
      {hasSteps && (
        <>
          <h3 className="sectionTitle">👨‍🍳 Pasos</h3>
          <ol style={{ lineHeight: 1.8, paddingLeft: 20 }}>
            {recipe.steps!.map((step, i) => (
              <li key={i} style={{ marginBottom: 12 }}>{step}</li>
            ))}
          </ol>
        </>
      )}

      {/* Acciones: Compartir / Volver */}
      <div className="btnRow">
        <button
          className="btn btnAccent"
          onClick={() => {
            const text = `${recipe.title} - ${window.location.href}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
          }}
        >
          Compartir
        </button>
        <Link href="/recetas" className="btn">← Volver</Link>
      </div>

      {/* FAB flotante (solo si hay pasos) */}
      {hasSteps && (
        <div className="fabWrap">
          <div className="fab" onClick={goToCooking} aria-label="Modo cocina">
            👨‍🍳
          </div>
        </div>
      )}
    </>
  );
}
