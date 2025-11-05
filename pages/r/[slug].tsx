import { useRouter } from "next/router";
import useSWR from "swr";
import { motion } from "framer-motion";
import Link from "next/link";
import { useFavorites } from "../../lib/useFavorites";
import { useEffect, useState } from "react";

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
  const r = await fetch(url);
  try { 
    if (!r.ok) {
      throw new Error(`HTTP error! status: ${r.status}`);
    }
    return await r.json(); 
  } catch { 
    return null; 
  }
};

function extractRecipe(resp: any, slug: string | string[] | undefined): Recipe | null {
  const s = Array.isArray(slug) ? slug[0] : slug;
  if (!resp) return null;
  
  // Decodificar el slug si viene codificado de la URL
  const decodedSlug = s ? decodeURIComponent(s) : '';
  
  const candidate = resp?.data ?? resp;
  if (Array.isArray(candidate)) {
    return candidate.find((x:any) => {
      const recipeSlug = x?.slug ? decodeURIComponent(x.slug) : '';
      return recipeSlug === decodedSlug;
    }) ?? null;
  }
  if (candidate && candidate.slug) return candidate as Recipe;
  if (candidate?.data?.slug) return candidate.data as Recipe;
  return null;
}

function toText(v:any){
  if(typeof v==="string") return v;
  if(typeof v==="number") return String(v);
  if(v && (v.name||v.title||v.text)) return String(v.name||v.title||v.text);
  try{return JSON.stringify(v)}catch{return ""}
}

export default function RecipeDetail() {
  const router = useRouter();
  const { slug } = router.query;

  // Decodificar el slug antes de enviarlo a la API
  const decodedSlug = slug ? decodeURIComponent(String(slug)) : null;
  
  const { data: resp, isLoading, error } = useSWR(
    decodedSlug ? `/api/recipes?slug=${encodeURIComponent(decodedSlug)}` : null,
    fetcher
  );
  const recipe: Recipe | null = extractRecipe(resp, slug);

  const { isFav, toggleFav } = useFavorites();
  const [fav, setFav] = useState(false);

  useEffect(() => { setFav(isFav(recipe?.slug)); }, [recipe?.slug, isFav]);

  const hasSteps = !!(recipe?.steps && Array.isArray(recipe.steps) && recipe.steps.length > 0);
  const mediaSrc =
    (recipe?.video_url || recipe?.image_url) ||
    `https://picsum.photos/seed/${encodeURIComponent(String(recipe?.slug || "recipe"))}/900/600`;

  const goToCooking = () => recipe && router.push(`/cocina/${encodeURIComponent(recipe.slug)}`);

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
    .error-message { 
      padding: 20px; 
      background: #fee; 
      border: 1px solid #f88; 
      border-radius: 8px; 
      color: #d00; 
      margin: 20px 0;
    }
  `;

  if (isLoading) return <p>Cargando receta…</p>;
  
  if (error) {
    return (
      <div className="error-message">
        <p><strong>Error cargando receta:</strong></p>
        <p>No se pudo cargar la receta "{decodedSlug}". Por favor, verifica que la receta existe.</p>
        <Link href="/recetas" className="btn">← Volver a Recetas</Link>
      </div>
    );
  }
  
  if (!recipe || typeof recipe.title !== "string" || typeof recipe.slug !== "string") {
    return (
      <div className="error-message">
        <p><strong>Receta no encontrada</strong></p>
        <p>La receta "{decodedSlug}" no existe o tiene un formato inválido.</p>
        <Link href="/recetas" className="btn">← Volver a Recetas</Link>
      </div>
    );
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
            alt={toText(recipe.title)}
            style={{ width: "100%", maxHeight: 460, objectFit: "cover", display: "block" }}
          />
        )}
      </motion.div>

      {/* Título + meta */}
      <h1 className="h1">{toText(recipe.title)}</h1>
      <p className="sub">
        ⏱ {typeof recipe.time_total === "number" ? recipe.time_total : 15} min · 🍽{" "}
        {typeof recipe.servings === "number" ? recipe.servings : 1} porciones
      </p>

      {/* Botón normal Modo Cocina */}
      {hasSteps && (
        <button onClick={goToCooking} className="btn btnAccent" style={{ width: "100%", marginTop: 12 }}>
          👨‍🍳 Modo Cocina
        </button>
      )}

      {/* Tags */}
      {safeTags.length > 0 && (
        <div className="tags">
          {safeTags.map((t:any) => (
            <span key={toText(t)} className="chip">#{toText(t)}</span>
          ))}
        </div>
      )}

      {/* Descripción */}
      {recipe.description && <p className="sub" style={{ marginTop: 8 }}>{toText(recipe.description)}</p>}

      {/* Ingredientes */}
      {safeIngredients.length > 0 && (
        <>
          <h3 className="sectionTitle">🛒 Ingredientes</h3>
          <ul style={{ lineHeight: 1.7 }}>
            {safeIngredients.map((ing:any, i:number) => <li key={i}>{toText(ing)}</li>)}
          </ul>
        </>
      )}

      {/* Pasos */}
      {safeSteps.length > 0 && (
        <>
          <h3 className="sectionTitle">👨‍🍳 Pasos</h3>
          <ol style={{ lineHeight: 1.8, paddingLeft: 20 }}>
            {safeSteps.map((step:any, i:number) => (
              <li key={i} style={{ marginBottom: 12 }}>{toText(step)}</li>
            ))}
          </ol>
        </>
      )}

      {/* Acciones: Compartir / Volver */}
      <div className="btnRow">
        <button
          className="btn btnAccent"
          onClick={() => {
            const text = `${toText(recipe.title)} - ${window.location.href}`;
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
          <div className="fabPill" onClick={goToCooking} aria-label="Modo cocina">
            <span style={{ fontSize: 22 }}>👨‍🍳</span>
            <span>Modo Cocina</span>
          </div>
        </div>
      )}
    </>
  );
}