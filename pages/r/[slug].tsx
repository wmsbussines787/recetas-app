import { useRouter } from "next/router";
import useSWR from "swr";
import { motion } from "framer-motion";
import Link from "next/link";
import { useFavorites } from "../../lib/useFavorites";

type Recipe = {
  id?: string | number;
  slug: string;
  title: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  ingredients?: any[];
  steps?: any[];
  tags?: any[];
  time_total?: number;
  servings?: number;
  nutrition?: { kcal?: number; carbs?: number; protein?: number; fat?: number };
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    // ignoramos el error de parseo para evaluar el estado HTTP
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "error" in payload && payload.error) ||
      response.statusText ||
      "Error al cargar la receta";
    throw new Error(String(message));
  }

  if (payload == null) {
    throw new Error("Respuesta inválida del servidor");
  }

  return payload;
};

function extractRecipe(resp: any, slug: string | string[] | undefined): Recipe | null {
  const s = Array.isArray(slug) ? slug[0] : slug;
  if (!resp) return null;
  const candidate = resp?.data ?? resp;
  if (Array.isArray(candidate)) return candidate.find((x:any)=>x?.slug===s) ?? null;
  if (candidate && candidate.slug) return candidate as Recipe;
  if (candidate?.data?.slug) return candidate.data as Recipe;
  return null;
}

function toText(v: any, fallback = '') {
  if (typeof v === "string" && v.trim()) return v;
  if (typeof v === "number") return String(v);
  if (v && (v.name || v.title || v.text)) return String(v.name || v.title || v.text);
  try {
    const serialized = JSON.stringify(v);
    return serialized === "{}" ? fallback : serialized;
  } catch {
    return fallback;
  }
}

export default function RecipeDetail() {
  const router = useRouter();
  const { slug } = router.query;

  const { data: resp, isLoading, error } = useSWR(
    slug ? `/api/recipes?slug=${encodeURIComponent(String(slug))}` : null,
    fetcher
  );
  const recipe: Recipe | null = extractRecipe(resp, slug);

  const { favs, toggleFav } = useFavorites();
  const fav = !!(recipe?.slug && favs.includes(recipe.slug));
  const recipeTitle = toText(recipe?.title, recipe?.slug ?? "Receta");

  const hasSteps = !!(recipe?.steps && Array.isArray(recipe.steps) && recipe.steps.length > 0);
  const mediaSrc =
    (recipe?.video_url || recipe?.image_url) ||
    `https://picsum.photos/seed/${encodeURIComponent(String(recipe?.slug || "recipe"))}/900/600`;

  const goToCooking = () => recipe && router.push(`/cocina/${recipe.slug}`);

  const css = `
    .hero { position: relative; width: 100%; border-radius: 16px; overflow: hidden; background: var(--card); margin-bottom: 20px; }
    .chip { border: 1px solid var(--chip); border-radius: 999px; padding: 4px 10px; font-size: 13px; }
    .btnRow { display: flex; gap: 10px; margin-top: 20px; }
    .btn { flex: 1; padding: 12px; border-radius: 12px; text-align: center; text-decoration: none; cursor: pointer; border: 1px solid var(--chip); background: var(--card); color: var(--fg); }
    .btnAccent { background: var(--accent); color: #fff; border-color: var(--accent); }
    .tags { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0 16px; }
    .sectionTitle { margin-top: 24px; margin-bottom: 8px; font-weight: 800; }
    .favOverlay {
      position: absolute; top: 12px; right: 12px; z-index: 5;
      width: 44px; height: 44px; border-radius: 999px; display:grid; place-items:center;
      font-size: 22px;
      background: rgba(0,0,0,0.7); color:#fff; border: 2px solid #fff; cursor: pointer;
      box-shadow: 0 10px 24px rgba(0,0,0,.35);
    }
    @media (prefers-color-scheme: light){ .favOverlay { background: rgba(255,255,255,0.7); color: #111; border-color: #111; } }
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
  if (error) {
    const message = error instanceof Error ? error.message : "Error cargando receta.";
    return <p style={{ color: "#ff6b6b" }}>{message}</p>;
  }
  if (!recipe || typeof recipe.title !== "string" || typeof recipe.slug !== "string") {
    return <p>No encontrada o formato inválido.</p>;
  }

  const safeTags = Array.isArray(recipe.tags) ? recipe.tags : [];
  const safeIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const safeSteps = Array.isArray(recipe.steps) ? recipe.steps : [];

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
          type="button"
          aria-pressed={fav}
          aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
          title={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
          onClick={() => {
            toggleFav(recipe.slug);
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
            aria-label={`Video de ${recipeTitle}`}
          />
        ) : (
          <img
            src={mediaSrc}
            alt={recipeTitle}
            style={{ width: "100%", maxHeight: 460, objectFit: "cover", display: "block" }}
          />
        )}
      </motion.div>

      {/* Título + meta */}
      <h1 className="h1">{recipeTitle}</h1>
      <p className="sub">
        ⏱ {typeof recipe.time_total === "number" ? recipe.time_total : 15} min · 🍽{" "}
        {typeof recipe.servings === "number" ? recipe.servings : 1} porciones
      </p>

      {/* Botón normal Modo Cocina */}
      {hasSteps && (
        <button
          type="button"
          onClick={goToCooking}
          className="btn btnAccent"
          style={{ width: "100%", marginTop: 12 }}
        >
          👨‍🍳 Modo Cocina
        </button>
      )}

      {/* Tags */}
      {safeTags.length > 0 && (
        <div className="tags">
          {safeTags.map((t:any, index:number) => (
            <span key={toText(t, `Etiqueta ${index + 1}`)} className="chip">#{toText(t, `Etiqueta ${index + 1}`)}</span>
          ))}
        </div>
      )}

      {/* Descripción */}
      {recipe.description && <p className="sub" style={{ marginTop: 8 }}>{toText(recipe.description, recipeTitle)}</p>}

      {/* Ingredientes */}
      {safeIngredients.length > 0 && (
        <>
          <h3 className="sectionTitle">🛒 Ingredientes</h3>
          <ul style={{ lineHeight: 1.7 }}>
            {safeIngredients.map((ing:any, i:number) => <li key={i}>{toText(ing, `Ingrediente ${i + 1}`)}</li>)}
          </ul>
        </>
      )}

      {/* Pasos */}
      {safeSteps.length > 0 && (
        <>
          <h3 className="sectionTitle">👨‍🍳 Pasos</h3>
          <ol style={{ lineHeight: 1.8, paddingLeft: 20 }}>
            {safeSteps.map((step:any, i:number) => (
              <li key={i} style={{ marginBottom: 12 }}>{toText(step, `Paso ${i + 1}`)}</li>
            ))}
          </ol>
        </>
      )}

      {/* Acciones: Compartir / Volver */}
      <div className="btnRow">
        <button
          type="button"
          className="btn btnAccent"
          onClick={() => {
            const text = `${recipeTitle} - ${window.location.href}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
          }}
        >
          Compartir
        </button>
        <Link href="/recetas" className="btn">← Volver</Link>
      </div>

      {/* FAB flotante (píldora) solo si hay pasos */}
      {safeSteps.length > 0 && (
        <div className="fabWrap">
          <button
            type="button"
            className="fabPill"
            onClick={goToCooking}
            aria-label="Abrir modo cocina"
          >
            <span aria-hidden="true" style={{ fontSize: 22 }}>
              👨‍🍳
            </span>
            <span>Modo Cocina</span>
          </button>
        </div>
      )}
    </>
  );
}
