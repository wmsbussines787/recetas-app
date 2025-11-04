import { useRouter } from "next/router";
import useSWR from "swr";
import { motion } from "framer-motion";
import Link from "next/link";
import { useFavorites } from "../../lib/useFavorites";
import { useEffect, useMemo, useState } from "react";

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

function normalizeRecipe(resp: any, slug: string | string[] | undefined): Recipe | null {
  if (!resp) return null;
  if (Array.isArray(resp)) {
    const s = Array.isArray(slug) ? slug[0] : slug;
    return resp.find((r) => r?.slug === s) ?? null;
  }
  return resp as Recipe;
}

export default function RecipeDetail() {
  const router = useRouter();
  const { slug } = router.query;

  const { data: resp, isLoading, error } = useSWR(
    slug ? `/api/recipes?slug=${encodeURIComponent(String(slug))}` : null,
    fetcher
  );
  const recipe: Recipe | null = normalizeRecipe(resp, slug);

  const { isFav, toggleFav } = useFavorites();
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(isFav(recipe?.slug));
  }, [recipe?.slug, isFav]);

  const hasSteps = !!(recipe?.steps && recipe.steps.length > 0);
  const mediaSrc =
    (recipe?.video_url || recipe?.image_url) ||
    `https://picsum.photos/seed/${encodeURIComponent(String(recipe?.slug || "recipe"))}/900/600`;

  const goToCooking = () => recipe && router.push(`/cocina/${recipe.slug}`);

  const css = `
    .hero { position: relative; width: 100%; border-radius: 16px; overflow: hidden; background: var(--card); margin-bottom: 20px; }
    .meta { display: flex; gap: 10px; flex-wrap: wrap; margin: 10px 0 18px; }
    .chip { border: 1px solid var(--chip); border-radius: 999px; padding: 4px 10px; font-size: 13px; }
    .btnRow { display: flex; gap: 10px; margin-top: 20px; }
    .btn { flex: 1; padding: 12px; border-radius: 12px; text-align: center; text-decoration: none; cursor: pointer; border: 1px solid var(--chip); background: var(--card); color: var(--fg); }
    .btnAccent { background: var(--accent); color: #fff; border-color: var(--accent); }
    .tags { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0 16px; }
    .sectionTitle { margin-top: 24px; margin-bottom: 8px; font-weight: 800; }

    /* Overlay de favorito en el HERO */
    .favOverlay {
      position: absolute; top: 12px; right: 12px; z-index: 5;
      width: 44px; height: 44px; border-radius: 999px; display:grid; place-items:center;
      font-size: 22px;
      background: rgba(0,0,0,0.7); color:#fff; border: 2px solid #fff; cursor: pointer;
      box-shadow: 0 10px 24px rgba(0,0,0,.35);
    }
    @media (prefers-color-scheme: light){ .favOverlay { background: rgba(255,255,255,0.7); color: #111; border-color: #111; } }

    /* FAB modo cocina (píldora) */
    .fabWrap { position: fixed; right: 18px; bottom: 96px; z-index: 40; }
    .fabPill {
      display: inline-flex; align-items: center; gap: 10px;
      height: 52px; padding: 0 16px; border-radius: 999px;
      background: rgba(0,0,0,0.85); color: #fff; border: 2px solid #fff;
      box-shadow: 0 12px 30px rgba(0,0,0,.35); cursor: pointer; user-select: none;
      font-weight: 700;
    }
    .fabPill:hover { filter: brightness(1.05); transform: translateY(-1px); transition: transform .15s ease; }
    @media (min-width: 1000px) { .fabPill { height: 56px; padding: 0 18px; } }
  `;

  if (isLoading) return <p>Cargando receta…</p>;
  if (error) return <p style={{ color: "#ff6b6b" }}>Error: {String(error)}</p>;
  if (!recipe) return <p>No encontrada.</p>;

  return (
    <>
      <style jsx global>{css}</style>

      {/* HERO */}
      <motion.div
        className="hero"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <button
          className="favOverlay"
          aria-pressed={fav}
          title={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
          onClick={() => {
            toggleFav(recipe.slug);
            setFav(isFav(recipe.slug));
          }}
        >
          {fav ? "⭐" : "☆"}
        </button>

        {recipe.video_url ? (
          <video
            src={mediaSrc}
            controls
            playsInline
            style={{ width: "100%", maxHeight: 460, objectFit: "cover", display: "block" }}
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
        👨‍🍳 Modo Cocina
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

      {/* FAB flotante (píldora) solo si hay pasos */}
      {hasSteps && (
        <div className="fabWrap">
          <div className="fabPill" onClick={goToCooking} aria-label="Modo cocina">
            <span style={{ fontSize: 22 }}>👨‍🍳</span>
            <span>Modo Cocina</span>
          </div>
        </div>
      )}
    </>
  );
}
