import { useRouter } from "next/router";
import useSWR from "swr";
import { motion } from "framer-motion";
import Link from "next/link";

type Recipe = {
  id: string | number;
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
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function RecipeDetail() {
  const router = useRouter();
  const { slug } = router.query;

  const { data: recipe, isLoading } = useSWR<Recipe>(
    slug ? `/api/recipes?slug=${slug}` : null,
    fetcher
  );

  if (isLoading) return <p>Cargando receta...</p>;
  if (!recipe) return <p>No encontrada.</p>;

  return (
    <>
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          width: "100%",
          borderRadius: 16,
          overflow: "hidden",
          background: "var(--card)",
          marginBottom: 20,
        }}
      >
        {recipe.video_url ? (
          <video
            src={recipe.video_url}
            controls
            playsInline
            style={{ width: "100%", maxHeight: 420, objectFit: "cover" }}
          />
        ) : (
          <img
            src={
              recipe.image_url ||
              `https://picsum.photos/seed/${encodeURIComponent(
                recipe.slug
              )}/800/600`
            }
            alt={recipe.title}
            style={{ width: "100%", maxHeight: 420, objectFit: "cover" }}
          />
        )}
      </motion.div>

      {/* TITLE + META */}
      <h1 className="h1">{recipe.title}</h1>
      <p className="sub">
        ⏱ {recipe.time_total ?? 15} min · 🍽 {recipe.servings ?? 1} porciones
      </p>

      {/* TAGS */}
      {recipe.tags && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {recipe.tags.map((t) => (
            <span
              key={t}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                background: "var(--chip)",
                fontSize: 13,
              }}
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* INGREDIENTS */}
      <h3 style={{ marginTop: 24, marginBottom: 8 }}>🛒 Ingredientes</h3>
      <ul style={{ lineHeight: 1.7 }}>
        {(recipe.ingredients || []).map((ing, i) => (
          <li key={i}>{ing}</li>
        ))}
      </ul>

      {/* STEPS */}
      <h3 style={{ marginTop: 30, marginBottom: 8 }}>👨‍🍳 Pasos</h3>
      <ol style={{ lineHeight: 1.8, paddingLeft: 20 }}>
        {(recipe.steps || []).map((step, i) => (
          <li key={i} style={{ marginBottom: 12 }}>
            {step}
          </li>
        ))}
      </ol>

      {/* BUTTONS */}
      <div style={{ display: "flex", gap: 10, marginTop: 30 }}>
        <button
          onClick={() =>
            window.open(
              `https://wa.me/?text=${encodeURIComponent(
                `${recipe.title} - ${window.location.href}`
              )}`
            )
          }
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 12,
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Compartir
        </button>

        <Link
          href="/recetas"
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: 12,
            background: "var(--chip)",
            textAlign: "center",
            color: "var(--fg)",
          }}
        >
          ← Volver
        </Link>
      </div>
    </>
  );
}
