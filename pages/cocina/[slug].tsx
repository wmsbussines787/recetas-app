import { useRouter } from "next/router";
import useSWR from "swr";
import { useState, useEffect } from "react";

type Recipe = {
  slug: string;
  title: string;
  ingredients?: string[];
  steps?: string[];
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CookingMode() {
  const router = useRouter();
  const { slug } = router.query;

  const { data: recipe, isLoading } = useSWR<Recipe>(
    slug ? `/api/recipes?slug=${slug}` : null,
    fetcher
  );

  const [stepIndex, setStepIndex] = useState(0);

  // Mantener pantalla activa mientras se cocina
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      // @ts-ignore
      if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen");
    };
    requestWakeLock();
    return () => wakeLock && wakeLock.release && wakeLock.release();
  }, []);

  if (isLoading) return <p style={{ fontSize: 24 }}>Cargando receta...</p>;
  if (!recipe) return <p style={{ fontSize: 24 }}>No encontrada.</p>;

  const step = recipe.steps?.[stepIndex];

  const speak = () => {
    if (!step) return;
    const msg = new SpeechSynthesisUtterance(step);
    msg.lang = "es-ES";
    window.speechSynthesis.speak(msg);
  };

  return (
    <div
      style={{
        padding: 24,
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontSize: 26,
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>{recipe.title}</h1>

      {/* Ingredientes si aún no empezó pasos */}
      {stepIndex === 0 && (
        <>
          <h2 style={{ marginTop: 24, fontSize: 28 }}>🛒 Ingredientes</h2>
          <ul style={{ fontSize: 24, marginBottom: 40 }}>
            {(recipe.ingredients || []).map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        </>
      )}

      {/* Paso actual */}
      {step && (
        <>
          <h2 style={{ marginTop: 24, fontSize: 28 }}>
            👨‍🍳 Paso {stepIndex} / {(recipe.steps?.length ?? 1) - 1}
          </h2>
          <p style={{ marginTop: 16 }}>{step}</p>
        </>
      )}

      {/* Botones navegación */}
      <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
        <button
          disabled={stepIndex === 0}
          onClick={() => setStepIndex(stepIndex - 1)}
          style={{
            flex: 1,
            padding: 16,
            fontSize: 20,
            background: "#333",
            color: "#fff",
            borderRadius: 12,
            border: "none",
          }}
        >
          ⬅️ Anterior
        </button>

        <button
          disabled={stepIndex >= (recipe.steps?.length ?? 1) - 1}
          onClick={() => setStepIndex(stepIndex + 1)}
          style={{
            flex: 1,
            padding: 16,
            fontSize: 20,
            background: "#3b82f6",
            color: "#fff",
            borderRadius: 12,
            border: "none",
          }}
        >
          Siguiente ➡️
        </button>
      </div>

      <button
        onClick={speak}
        style={{
          width: "100%",
          marginTop: 20,
          padding: 16,
          fontSize: 20,
          background: "#10b981",
          color: "#fff",
          borderRadius: 12,
          border: "none",
        }}
      >
        🔊 Leer en voz alta
      </button>

      <button
        onClick={() => router.push(`/r/${recipe.slug}`)}
        style={{
          width: "100%",
          marginTop: 30,
          padding: 16,
          fontSize: 20,
          background: "#444",
          color: "#fff",
          borderRadius: 12,
          border: "none",
        }}
      >
        ← Salir del modo cocina
      </button>
    </div>
  );
}
